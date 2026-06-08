import React from 'react';

interface AchievementBadgeProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  isNew?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ name, description, icon, unlocked, isNew }) => {
  return (
    <div className={`relative p-3 rounded-sm border transition-all duration-300 ${
      unlocked
        ? 'bg-brand/5 border-brand/30 opacity-100 hover:bg-brand/10 hover:border-brand/50'
        : 'bg-black/20 border-white/5 opacity-40 grayscale'
    }`}>
      {isNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-full animate-ping" />
      )}
      <div className="flex items-center gap-3">
        <div className={`text-2xl ${unlocked ? 'animate-float' : ''}`}>{icon}</div>
        <div>
          <div className={`text-[10px] font-heading font-black uppercase tracking-wider ${unlocked ? 'text-white' : 'text-muted'}`}>
            {name}
          </div>
          <div className="text-[8px] font-mono text-muted/60 mt-0.5">{description}</div>
        </div>
      </div>
    </div>
  );
};
