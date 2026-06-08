export const ACHIEVEMENTS = [
  {
    id: 'first_trade',
    name: 'First Blood',
    description: 'Execute your first trade',
    icon: '⚔',
    condition: (stats: any) => stats.tradesCount >= 1,
  },
  {
    id: 'day_trader',
    name: 'Day Trader',
    description: 'Execute 100 trades',
    icon: '📈',
    condition: (stats: any) => stats.tradesCount >= 100,
  },
  {
    id: 'millionaire',
    name: 'Millionaire',
    description: 'Reach Φ 1,000,000 net worth',
    icon: '💎',
    condition: (stats: any) => stats.netWorth >= 1_000_000,
  },
  {
    id: 'whale',
    name: 'Whale Alert',
    description: 'Execute a single trade over Φ 100,000',
    icon: '🐋',
    condition: (stats: any) => stats.biggestTrade >= 100_000,
  },
  {
    id: 'collector',
    name: 'Full Collection',
    description: 'Hold shares in 10+ different characters',
    icon: '🃏',
    condition: (stats: any) => stats.charactersHeld >= 10,
  },
  {
    id: 'top_five',
    name: 'Elite Circle',
    description: 'Reach Top 5 on the leaderboard',
    icon: '👑',
    condition: (stats: any) => stats.leaderboardRank !== null && stats.leaderboardRank <= 5,
  },
  {
    id: 'hodler',
    name: 'The HODLer',
    description: 'Hold a position for over 24 hours',
    icon: '🧊',
    condition: (stats: any) => stats.tradesCount >= 10,
  },
  {
    id: 'rich',
    name: 'Φ Billionaire',
    description: 'Reach Φ 10,000,000 net worth',
    icon: '🏦',
    condition: (stats: any) => stats.netWorth >= 10_000_000,
  },
];

export const checkNewAchievements = (currentBadges: string[], stats: any) => {
  const newOnes: any[] = [];
  for (const ach of ACHIEVEMENTS) {
    if (!currentBadges.includes(ach.id) && ach.condition(stats)) {
      newOnes.push(ach);
    }
  }
  return newOnes;
};
