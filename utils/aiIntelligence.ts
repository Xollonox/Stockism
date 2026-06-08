// AI Intelligence Engine — powers auto-price fluctuation and news generation
// Supports:
//   - Gemini API (cloud, free tier)
//   - Ollama Cloud API (gemma4:31b-cloud, etc.)
//   - Ollama Local (self-hosted)

// ─── CONFIGURATION ──────────────────────────────────────
// Set these in .env or hardcode for testing
const AI_PROVIDER = 'ollama'; // 'gemini' | 'ollama'
const AI_API_KEY = 'fb7ae1edc8844ad28f8066bb8dacd7bf.VdL_FtDEP8VCcCbHxSdnK0Ij';
const OLLAMA_URL = 'https://api.ollama.com';
const OLLAMA_MODEL = 'gemma4:31b-cloud';

// ─── LOOKISM LORE DATABASE ───────────────────────────────
// Hardcoded canon data to ground the AI
const LOOKISM_CANON = {
  crews: {
    'Allied': { leader: 'Daniel Park', strength: 9, influence: 9 },
    'Workers': { leader: 'Eugene', strength: 8, influence: 10 },
    'Big Deal': { leader: 'Jake Kim', strength: 8, influence: 7 },
    'Hostel': { leader: 'Eli Jang', strength: 7, influence: 6 },
    'God Dog': { leader: 'Logan Lee', strength: 5, influence: 4 },
    'Burn Knuckles': { leader: 'Vasco', strength: 7, influence: 5 },
    'Gen 0': { leader: 'Gapryong Kim', strength: 10, influence: 10 },
    'Gen 1': { leader: 'James Lee', strength: 10, influence: 9 },
  },
  topTiers: ['Gun Park', 'Goo Kim', 'Daniel Park', 'James Lee', 'Tom Lee', 'Johan Seong', 'Jake Kim', 'Samuel Seo'],
};

// ─── AI CLIENT ────────────────────────────────────────────
async function queryAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (AI_PROVIDER === 'ollama') {
    return queryOllama(systemPrompt, userPrompt);
  }
  return queryGemini(systemPrompt, userPrompt);
}

async function queryGemini(system: string, prompt: string): Promise<string> {
  if (!AI_API_KEY) throw new Error('VITE_AI_API_KEY not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${AI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${system}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function queryOllama(system: string, prompt: string): Promise<string> {
  // Ollama Cloud uses OpenAI-compatible chat endpoint
  const res = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

// ─── PRICE INTELLIGENCE ──────────────────────────────────
export interface PriceSuggestion {
  charId: string;
  name: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export async function analyzeMarket(market: any[]): Promise<{
  suggestions: PriceSuggestion[];
  newsToGenerate: { title: string; body: string; type: string; impact: number; charId?: string }[];
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
}> {
  const systemPrompt = `You are STOCKISM AI — a Lookism financial intelligence agent.
Your job: Analyze the current character market and suggest realistic price fluctuations based on Lookism canon lore.

RULES:
- Price changes must be realistic (-15% to +25% per cycle)
- Consider character strength, story relevance, crew power
- Top tiers (Gun, Goo, Daniel, James, Johan, Jake) should have higher base values
- Generate 2-5 price suggestions per cycle
- Generate 1-2 news headlines about market events
- Output ONLY valid JSON, no markdown

OUTPUT FORMAT:
{
  "suggestions": [
    { "charId": "string", "name": "string", "currentPrice": number, "suggestedPrice": number, "reason": "string", "confidence": "high|medium|low" }
  ],
  "newsToGenerate": [
    { "title": "string", "body": "string", "type": "character|market|event", "impact": number (percentage), "charId": "string (optional)" }
  ],
  "marketSentiment": "bullish|bearish|neutral"
}`;

  const charSummaries = market.map(c => 
    `- ${c.name} (ID: ${c.id}) | Crew: ${c.crew} | Rarity: ${c.rarity} | Current Price: Φ${c.price} | Tier: ${c.tier}`
  ).join('\n');

  const prompt = `Current market state:\n${charSummaries}\n\nTop tier characters: ${LOOKISM_CANON.topTiers.join(', ')}\n\nAnalyze and suggest price changes based on Lookism lore. Return valid JSON only.`;

  try {
    const raw = await queryAI(systemPrompt, prompt);
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      suggestions: parsed.suggestions || [],
      newsToGenerate: parsed.newsToGenerate || [],
      marketSentiment: parsed.marketSentiment || 'neutral',
    };
  } catch (e) {
    console.error('AI analysis failed, using fallback logic:', e);
    return fallbackAnalysis(market);
  }
}

// ─── FALLBACK (when AI is unavailable) ────────────────────
function fallbackAnalysis(market: any[]): ReturnType<typeof analyzeMarket> extends Promise<infer T> ? T : never {
  const suggestions: PriceSuggestion[] = [];
  const newsToGenerate: any[] = [];

  // Random walk with some logic
  for (const char of market) {
    // Top tiers get more volatility
    const isTopTier = LOOKISM_CANON.topTiers.includes(char.name);
    const volatility = isTopTier ? 0.12 : 0.06;
    
    // Random but bounded move
    const change = (Math.random() - 0.45) * 2 * volatility * char.price;
    const newPrice = Math.max(10, Math.round(char.price + change));
    
    if (Math.abs(newPrice - char.price) > 1) {
      const isUp = newPrice > char.price;
      suggestions.push({
        charId: char.id,
        name: char.name,
        currentPrice: char.price,
        suggestedPrice: newPrice,
        reason: isUp 
          ? `${char.name} shows strong market activity in recent trading sessions`
          : `${char.name} facing mild sell pressure in current market conditions`,
        confidence: 'medium',
      });
    }
  }

  // Pick random character for news
  if (suggestions.length > 0) {
    const topMove = suggestions.reduce((a, b) => 
      Math.abs(b.suggestedPrice - b.currentPrice) > Math.abs(a.suggestedPrice - a.currentPrice) ? b : a
    );
    const isUp = topMove.suggestedPrice > topMove.currentPrice;
    newsToGenerate.push({
      title: `${topMove.name} ${isUp ? 'Surges' : 'Dips'} in Latest Trading Session`,
      body: `${topMove.name} (${topMove.reason}) — currently trading at Φ${topMove.suggestedPrice.toLocaleString()}${isUp ? ', up' : ', down'} from Φ${topMove.currentPrice.toLocaleString()}.`,
      type: 'character',
      impact: Math.round(((topMove.suggestedPrice - topMove.currentPrice) / topMove.currentPrice) * 100),
      charId: topMove.charId,
    });
  }

  return { suggestions, newsToGenerate, marketSentiment: 'neutral' };
}

// ─── NEWS GENERATOR ──────────────────────────────────────
export async function generateNewsHeadline(market: any[]): Promise<{
  title: string;
  body: string;
  type: string;
  impact: number;
  charId?: string;
} | null> {
  try {
    const analysis = await analyzeMarket(market);
    if (analysis.newsToGenerate.length > 0) return analysis.newsToGenerate[0];
    return null;
  } catch {
    return null;
  }
}
