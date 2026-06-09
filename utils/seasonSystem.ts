// Season System — auto-rewards, leaderboard reset, season tracking
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const SEASON_REWARDS: Record<number, number> = {
  1: 10000,
  2: 5000,
  3: 2500,
  4: 1000,
  5: 500,
};

export async function getCurrentSeason(): Promise<number> {
  const snap = await getDoc(doc(db, 'game', 'settings'));
  return snap.data()?.season || 1;
}

export async function endSeason(adminUid: string): Promise<{ season: number; rewarded: number }> {
  const settingsSnap = await getDoc(doc(db, 'game', 'settings'));
  const currentSeason = settingsSnap.data()?.season || 1;
  const newSeason = currentSeason + 1;

  // Get top 5 leaderboard
  const lbQuery = query(collection(db, 'users_public'), orderBy('netWorth', 'desc'), limit(5));
  const lbSnap = await getDocs(lbQuery);
  let rewarded = 0;

  // Reward top 5
  for (let i = 0; i < lbSnap.docs.length; i++) {
    const uid = lbSnap.docs[i].id;
    const rank = i + 1;
    const reward = SEASON_REWARDS[rank] || 0;
    if (reward > 0) {
      try {
        await runTransaction(db, async (txn) => {
          const userRef = doc(db, 'users', uid);
          const userSnap = await txn.get(userRef);
          if (!userSnap.exists()) return;
          txn.update(userRef, { cash: (userSnap.data().cash || 0) + reward });
        });
        rewarded++;
      } catch {}
    }
  }

  // Reset season + announce
  await updateDoc(doc(db, 'game', 'settings'), {
    season: newSeason,
    [`season_${currentSeason}_ended`]: serverTimestamp(),
    [`season_${newSeason}_started`]: serverTimestamp(),
  });

  return { season: newSeason, rewarded };
}

export function getSeasonRewards() {
  return SEASON_REWARDS;
}
