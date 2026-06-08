export const DAILY_MISSIONS = [
  {
    id: 'trade_3',
    title: 'Active Trader',
    description: 'Execute 3 trades today',
    reward: 500,
    icon: '📊',
    type: 'trade',
    target: 3,
  },
  {
    id: 'networth_5pct',
    title: 'Portfolio Growth',
    description: 'Increase net worth by 5% today',
    reward: 1000,
    icon: '📈',
    type: 'networth',
    target: 5,
  },
  {
    id: 'vote_once',
    title: 'Civic Duty',
    description: 'Cast your vote today',
    reward: 200,
    icon: '🗳',
    type: 'vote',
    target: 1,
  },
  {
    id: 'visit_market',
    title: 'Market Surveillance',
    description: 'Visit the exchange',
    reward: 100,
    icon: '👁',
    type: 'visit',
    target: 1,
  },
  {
    id: 'profit_1k',
    title: 'Profit Seeker',
    description: 'Make Φ 1,000 profit from trades',
    reward: 750,
    icon: '💰',
    type: 'profit',
    target: 1000,
  },
];

export const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const checkMissionProgress = (missions: any[], type: string, amount: number = 1) => {
  const today = getTodayStr();
  return missions.map(m => {
    if (m.date !== today || m.claimed) return m;
    if (m.missionId === type || DAILY_MISSIONS.find(dm => dm.id === m.missionId)?.type === type) {
      m.progress = Math.min(m.progress + amount, DAILY_MISSIONS.find(dm => dm.id === m.missionId)?.target || amount);
      if (m.progress >= (DAILY_MISSIONS.find(dm => dm.id === m.missionId)?.target || 1)) {
        m.completed = true;
      }
    }
    return m;
  });
};
