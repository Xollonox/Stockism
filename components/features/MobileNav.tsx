import React from 'react';

interface MobileNavProps {
  activeView: string;
  setView: (v: string) => void;
  isAdmin: boolean;
  isGuest: boolean;
}

const NAV_ITEMS = [
  { view: 'dashboard', icon: '◈', label: 'Home' },
  { view: 'market', icon: 'MK', label: 'Exchange' },
  { view: 'portfolio', icon: 'PF', label: 'Assets', requiresAuth: true },
  { view: 'leaderboard', icon: 'LB', label: 'Rank' },
  { view: 'profile', icon: 'ID', label: 'Profile', requiresAuth: true },
];

export const MobileNav: React.FC<MobileNavProps> = ({ activeView, setView, isAdmin, isGuest }) => {
  const visible = NAV_ITEMS.filter(item => !item.requiresAuth || !isGuest);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] safe-area-bottom">
      {/* Glass background */}
      <div className="absolute inset-0 bg-bg1/95 backdrop-blur-2xl border-t border-line" />
      
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
      
      <nav className="relative flex items-center justify-around py-2 px-2">
        {visible.map(item => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 min-w-[60px] ${
                isActive 
                  ? 'text-brand scale-105' 
                  : 'text-muted/50 hover:text-white/80'
              }`}
            >
              <div className={`text-[13px] font-heading font-black tracking-wider transition-all ${
                isActive ? 'drop-shadow-[0_0_8px_var(--color-brand)]' : ''
              }`}>
                {item.icon}
              </div>
              <span className={`text-[8px] font-heading font-black uppercase tracking-widest ${
                isActive ? 'opacity-100' : 'opacity-60'
              }`}>
                {isActive ? `[${item.label}]` : item.label}
              </span>
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-brand rounded-full shadow-[0_0_8px_var(--color-brand)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Safe area spacer for notched phones */}
      <div className="h-safe-bottom" />
    </div>
  );
};
