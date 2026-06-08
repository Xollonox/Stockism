import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  username: string;
  netWorth: number;
  liquidPhi?: number;
  updatedAt: Timestamp;
  isBanned?: boolean; 
  reputation?: number;
  badges?: string[];
  missions?: DailyMissionProgress[];
  tutorialComplete?: boolean;
}

export interface UserPrivateData {
  cash: number;
  createdAt: Timestamp;
  email?: string;
  isBanned?: boolean;
  role?: 'admin' | 'worker';
  bonusClaimed?: boolean;
  tutorialComplete?: boolean;
  streak?: number;
  lastLoginDate?: string;
  mysteryBoxes?: number;
}

export interface Character {
  id: string;
  name: string;
  price: number;
  crew: string;
  rarity: string;
  tier: number;
  imageUrl?: string;
  updatedAt?: Timestamp;
  isWaifu?: boolean;
  gender?: 'Male' | 'Female';
  popularityVotes?: number;
  prevPopularityRank?: number;
  strengthVotes?: number;
  prevStrengthRank?: number;
  allTimeHigh?: number;
  holdersCount?: number;
  volatility?: number; // ±% per tick
  priceHistory?: { time: number; price: number }[];
  lastUpdated?: number;
}

export interface PricePoint {
  time: number;
  price: number;
}

export interface GameSettings {
  tradingEnabled: boolean;
  marketMessage: string;
  season: number;
  cashCap: number;
  cooldownSeconds: number;
  maxSharesPerUser: number;
  frozenCharacters: string[];
  popularityVotingEnabled?: boolean;
  strongestVotingEnabled?: boolean;
  bannerImageUrl?: string;
  event?: GameEvent;
}

export interface GameEvent {
  active: boolean;
  name: string;
  description: string;
  priceMultiplier: number;
  type?: 'crash' | 'spotlight' | 'crew_war' | 'mystery_box' | 'bonus';
  endsAt?: Timestamp;
  spotlightCharId?: string;
  crewWarCrews?: string[];
}

export interface Trade {
  uid: string;
  username: string;
  charId: string;
  character: string;
  crew: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  total: number;
  season: number;
  createdAt: Timestamp;
  isWhale?: boolean;
}

export interface Holding {
  shares: number;
  avgBuyPrice?: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'market' | 'character' | 'event' | 'system';
  relatedCharacterId?: string;
  characterName?: string;
  priceChange?: number;
  createdAt: Timestamp;
  createdBy: string;
  priceImpact?: number;
  expiresAt?: Timestamp;
  impactedCharId?: string;
}

// Achievement System
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  tradesCount: number;
  netWorth: number;
  biggestTrade: number;
  holdingsCount: number;
  charactersHeld: number;
  leaderboardRank: number | null;
}

// Daily Missions
export interface DailyMission {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  type: 'trade' | 'networth' | 'vote' | 'visit' | 'profit';
  target: number;
}

export interface DailyMissionProgress {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  date: string;
}

// Toast Notifications
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'achievement';
  duration?: number;
}

// Price History
export interface PriceHistory {
  charId: string;
  prices: { time: number; price: number }[];
}

export interface MysteryBox {
  id: string;
  cost: number;
  rewards: string[];
  icon: string;
}

export interface LoginStreak {
  current: number;
  max: number;
  lastDate: string;
  claimedToday: boolean;
}
