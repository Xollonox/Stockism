// Trading Bot System — users set auto-trade rules
// Stored in Firestore: bots/{botId}
import { doc, setDoc, updateDoc, deleteDoc, getDoc, collection, getDocs, addDoc, serverTimestamp, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export interface TradeBot {
  id?: string;
  uid: string;
  username: string;
  charId: string;
  charName: string;
  type: 'buy' | 'sell';
  trigger: 'price_below' | 'price_above' | 'daily_change_pct';
  triggerValue: number;
  quantity: number;
  active: boolean;
  createdAt: any;
  lastTriggered?: any;
}

export async function createBot(bot: Omit<TradeBot, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'bots'), {
    ...bot,
    createdAt: serverTimestamp(),
    active: true,
  });
  return ref.id;
}

export async function deleteBot(botId: string) {
  await deleteDoc(doc(db, 'bots', botId));
}

export async function toggleBot(botId: string, active: boolean) {
  await updateDoc(doc(db, 'bots', botId), { active });
}

export async function executeBotTrade(bot: TradeBot, currentPrice: number): Promise<boolean> {
  if (!bot.active) return false;

  const shouldTrigger = bot.trigger === 'price_below' && currentPrice <= bot.triggerValue
    || bot.trigger === 'price_above' && currentPrice >= bot.triggerValue;

  if (!shouldTrigger) return false;

  try {
    await runTransaction(db, async (txn) => {
      const userRef = doc(db, 'users', bot.uid);
      const userSnap = await txn.get(userRef);
      if (!userSnap.exists()) throw new Error('User gone');

      const cash = userSnap.data().cash || 0;
      const charRef = doc(db, 'characters', bot.charId);
      const charSnap = await txn.get(charRef);
      if (!charSnap.exists()) throw new Error('Character gone');
      const charPrice = charSnap.data().price || 0;

      if (bot.type === 'buy') {
        const cost = charPrice * bot.quantity;
        if (cash < cost) throw new Error('Not enough Phi');
        txn.update(userRef, { cash: cash - cost });
        const holdingRef = doc(db, 'holdings', bot.uid, 'items', bot.charId);
        const holdingSnap = await txn.get(holdingRef);
        const currentShares = holdingSnap.exists() ? holdingSnap.data().shares || 0 : 0;
        txn.set(holdingRef, { shares: currentShares + bot.quantity }, { merge: true });
      } else {
        const holdingRef = doc(db, 'holdings', bot.uid, 'items', bot.charId);
        const holdingSnap = await txn.get(holdingRef);
        const currentShares = holdingSnap.exists() ? holdingSnap.data().shares || 0 : 0;
        if (currentShares < bot.quantity) throw new Error('Not enough shares');
        txn.update(userRef, { cash: cash + charPrice * bot.quantity });
        txn.set(holdingRef, { shares: currentShares - bot.quantity }, { merge: true });
      }

      // Log trade
      const tradeId = `bot_${bot.uid}_${Date.now()}`;
      txn.set(doc(db, 'trades', tradeId), {
        uid: bot.uid, username: bot.username,
        charId: bot.charId, character: bot.charName, side: bot.type.toUpperCase(),
        qty: bot.quantity, price: charPrice, total: charPrice * bot.quantity,
        createdAt: serverTimestamp(), isBot: true,
      });

      txn.update(doc(db, 'bots', bot.id!), { lastTriggered: serverTimestamp() });
    });
    return true;
  } catch { return false; }
}

export async function checkAndExecuteBots(market: any[]) {
  const botsSnap = await getDocs(collection(db, 'bots'));
  const bots = botsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TradeBot));

  for (const bot of bots) {
    if (!bot.active) continue;
    const char = market.find(c => c.id === bot.charId);
    if (!char) continue;
    await executeBotTrade(bot, char.price || 0);
  }
}
