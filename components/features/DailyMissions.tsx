import React from 'react';
import { DAILY_MISSIONS } from '../../utils/missions';
import { DailyMissionProgress } from '../../types';

interface DailyMissionsProps {
  missions: DailyMissionProgress[];
  onClaim: (missionId: string) => void;
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({ missions, onClaim }) => {
  const getMissionDef = (id: string) => DAILY_MISSIONS.find(m => m.id === id);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 bg-brand rounded-full animate-pulse" />
        <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.15em]">Daily Missions</h3>
        <span className="text-[8px] font-mono text-muted/50 ml-auto">{today}</span>
      </div>

      {DAILY_MISSIONS.map(def => {
        const progress = missions.find(m => m.missionId === def.id);
        const pct = progress ? Math.min((progress.progress / def.target) * 100, 100) : 0;
        const completed = progress?.completed || false;
        const claimed = progress?.claimed || false;

        return (
          <div
            key={def.id}
            className={`p-3 rounded-sm border transition-all duration-300 ${
              claimed ? 'bg-black/20 border-white/5 opacity-40' :
              completed ? 'bg-brand/10 border-brand/30' :
              'bg-black/20 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-lg shrink-0">{def.icon}</span>
                <div className="min-w-0">
                  <div className="text-[10px] font-heading font-black text-white uppercase tracking-wider truncate">{def.title}</div>
                  <div className="text-[8px] font-mono text-muted/60 mt-0.5 truncate">{def.description}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] font-mono font-bold text-brand">Φ {def.reward.toLocaleString()}</div>
                {claimed ? (
                  <div className="text-[8px] font-mono text-muted/50 mt-0.5">Claimed ✓</div>
                ) : completed ? (
                  <button
                    onClick={() => onClaim(def.id)}
                    className="text-[8px] font-mono font-bold text-good hover:text-white transition-colors mt-0.5 uppercase tracking-wider"
                  >
                    Claim Reward
                  </button>
                ) : (
                  <div className="text-[8px] font-mono text-muted/50 mt-0.5">{progress?.progress || 0}/{def.target}</div>
                )}
              </div>
            </div>
            {/* Progress Bar */}
            {!claimed && (
              <div className="mt-2 w-full h-1 bg-black/40 border border-white/5 rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded ${completed ? 'bg-brand shadow-[0_0_6px_var(--color-brand)]' : 'bg-white/20'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
