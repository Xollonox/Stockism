import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

const STREAK_BONUSES = [0, 100, 200, 350, 500, 750, 1000, 1500, 2000, 3000, 5000];

export const checkLoginStreak = async (uid: string): Promise<{ streak: number; bonus: number; isNew: boolean }> => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { streak: 1, bonus: 100, isNew: true };

  const data = snap.data();
  const lastDate = data.lastLoginDate || '';
  const currentStreak = data.streak || 0;
  const today = new Date().toISOString().split('T')[0];

  if (lastDate === today) {
    return { streak: currentStreak, bonus: 0, isNew: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = lastDate === yesterday ? currentStreak + 1 : 1;
  const bonusIndex = Math.min(newStreak - 1, STREAK_BONUSES.length - 1);
  const bonus = STREAK_BONUSES[bonusIndex];

  await updateDoc(userRef, {
    streak: newStreak,
    lastLoginDate: today,
    cash: (data.cash || 0) + bonus,
  });

  return { streak: newStreak, bonus, isNew: true };
};

export const MYSTERY_BOXES = [
  { id: 'bronze', cost: 500, icon: '📦', label: 'Bronze Crate', rewards: ['Φ 200-500', 'Common Share'] },
  { id: 'silver', cost: 2000, icon: '🎁', label: 'Silver Cache', rewards: ['Φ 500-1500', 'Rare Share+'] },
  { id: 'gold', cost: 10000, icon: '💎', label: 'Golden Vault', rewards: ['Φ 2000-5000', 'Epic Share+', 'Mystery Badge'] },
];

export const openMysteryBox = async (uid: string, boxId: string): Promise<{ reward: string; amount: number }> => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error('User not found');

  const data = snap.data();
  const box = MYSTERY_BOXES.find(b => b.id === boxId);
  if (!box) throw new Error('Unknown box');
  if ((data.cash || 0) < box.cost) throw new Error('Insufficient funds');

  // Roll reward
  const roll = Math.random();
  let reward: string;
  let amount: number;

  if (boxId === 'bronze') {
    amount = 200 + Math.floor(Math.random() * 300);
    reward = `Φ ${amount}`;
  } else if (boxId === 'silver') {
    amount = 500 + Math.floor(Math.random() * 1000);
    reward = `Φ ${amount}`;
  } else {
    amount = 2000 + Math.floor(Math.random() * 3000);
    reward = `Φ ${amount}`;
  }

  await updateDoc(userRef, {
    cash: (data.cash || 0) - box.cost + amount,
  });

  return { reward, amount };
};
