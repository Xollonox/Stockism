// AI Market Agent — runs every 15-30 minutes to:
// 1. Analyze Lookism market via AI
// 2. Update character prices
// 3. Auto-generate news headlines
// 4. Adjust market sentiment

import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { analyzeMarket } from './aiIntelligence';

const CYCLE_INTERVAL = 15 * 60 * 1000; // 15 minutes (min)
const CYCLE_MAX = 30 * 60 * 1000;       // 30 minutes (max)

let intervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

export function startMarketAgent(market: any[]) {
  if (isRunning) return;
  isRunning = true;

  const runCycle = async () => {
    try {
      console.log('[AI Agent] Analyzing market...');
      const analysis = await analyzeMarket(market);

      // Apply price changes
      for (const suggestion of analysis.suggestions) {
        try {
          await updateDoc(doc(db, 'characters', suggestion.charId), {
            price: suggestion.suggestedPrice,
            updatedAt: serverTimestamp(),
          });
          console.log(`[AI Agent] Updated ${suggestion.name}: Φ${suggestion.currentPrice} → Φ${suggestion.suggestedPrice} (${suggestion.reason})`);
        } catch (e) {
          console.warn(`[AI Agent] Failed to update ${suggestion.name}:`, e);
        }
      }

      // Generate news
      for (const news of analysis.newsToGenerate) {
        try {
          await addDoc(collection(db, 'news'), {
            title: news.title,
            body: news.body,
            type: news.type || 'market',
            relatedCharacterId: news.charId || null,
            characterName: market.find(c => c.id === news.charId)?.name || null,
            priceChange: news.impact || 0,
            createdAt: serverTimestamp(),
            createdBy: 'AI Agent',
          });
          console.log(`[AI Agent] Generated news: ${news.title}`);
        } catch (e) {
          console.warn('[AI Agent] Failed to generate news:', e);
        }
      }

      console.log(`[AI Agent] Cycle complete — ${analysis.suggestions.length} price changes, ${analysis.newsToGenerate.length} news items. Sentiment: ${analysis.marketSentiment}`);
    } catch (e) {
      console.error('[AI Agent] Cycle failed:', e);
    }

    // Schedule next cycle at random interval between 15-30 min
    const nextDelay = CYCLE_INTERVAL + Math.random() * (CYCLE_MAX - CYCLE_INTERVAL);
    if (intervalId) clearTimeout(intervalId);
    intervalId = setTimeout(runCycle, nextDelay);
  };

  // Start first cycle after initial delay
  const initialDelay = 60000; // 1 minute after startup
  intervalId = setTimeout(runCycle, initialDelay);

  return () => stopMarketAgent();
}

export function stopMarketAgent() {
  if (intervalId) {
    clearTimeout(intervalId);
    intervalId = null;
  }
  isRunning = false;
}

// Manual trigger (for admin panel)
export async function triggerAICycle(market: any[]) {
  const analysis = await analyzeMarket(market);
  let changes = 0;
  let newsCount = 0;

  for (const suggestion of analysis.suggestions) {
    try {
      await updateDoc(doc(db, 'characters', suggestion.charId), {
        price: suggestion.suggestedPrice,
        updatedAt: serverTimestamp(),
      });
      changes++;
    } catch {}
  }

  for (const news of analysis.newsToGenerate) {
    try {
      await addDoc(collection(db, 'news'), {
        title: news.title,
        body: news.body,
        type: news.type || 'market',
        relatedCharacterId: news.charId || null,
        characterName: market.find((c: any) => c.id === news.charId)?.name || null,
        priceChange: news.impact || 0,
        createdAt: serverTimestamp(),
        createdBy: 'AI Agent (Manual)',
      });
      newsCount++;
    } catch {}
  }

  return { changes, newsCount, sentiment: analysis.marketSentiment };
}
