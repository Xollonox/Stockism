
import React, { useMemo } from 'react';
import { Character, GameSettings } from '../../types';
import { Button } from '../ui/Button';

interface StrongestRankProps {
  market: Character[];
  settings: GameSettings;
  onVote: (charId: string) => void;
}

export const StrongestRank: React.FC<StrongestRankProps> = React.memo(({ market, settings, onVote }) => {
  const placeholder = "/assets/placeholder-character.png";

  const sortedMarket = useMemo(() => {
    return [...market].sort((a,b) => (b.strengthVotes || 0) - (a.strengthVotes || 0));
  }, [market]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
        {/* Premium Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-brand/10 to-transparent border-l-4 border-brand p-8 shadow-2xl group">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
               <div>
                   <h2 className="text-5xl font-heading text-white italic tracking-tighter drop-shadow-lg">POWER <span className="text-brand text-transparent bg-clip-text bg-gradient-to-r from-brand to-pink-500">RANKINGS</span></h2>
                   <p className="text-xs text-brand/80 font-mono font-bold tracking-[0.3em] uppercase mt-2 pl-1">Daily Strength Consensus Protocol</p>
               </div>
               <div className="flex items-center gap-3">
                   <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm backdrop-blur-md shadow-lg border ${
                     settings.strongestVotingEnabled 
                       ? 'bg-good/20 border-good/30 text-good' 
                       : 'bg-bad/20 border-bad/30 text-bad'
                   }`}>
                       {settings.strongestVotingEnabled ? 'VOTING_ACTIVE' : 'VOTING_LOCKED'}
                   </div>
               </div>
           </div>
           
           {/* Decorative Elements */}
           <div className="absolute -right-10 -bottom-12 text-[12rem] text-brand/5 select-none font-heading italic pointer-events-none group-hover:scale-105 transition-transform duration-1000 ease-out">⚡</div>
           <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand/5 to-transparent pointer-events-none" />
           <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
        </div>

        <div className="space-y-4" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 100px' }}>
            {sortedMarket.map((c, i) => {
                const currentRank = i + 1;
                const prevRank = c.prevStrengthRank || 0;
                let moveIcon = '•';
                let moveColor = 'text-muted/40';
                
                if (prevRank > 0) {
                    if (currentRank < prevRank) { moveIcon = '▲ ' + (prevRank - currentRank); moveColor = 'text-good'; }
                    else if (currentRank > prevRank) { moveIcon = '▼ ' + (currentRank - prevRank); moveColor = 'text-bad'; }
                }

                // Cyberpunk Tiers
                let tierLabel = "TIER_03";
                let tierColor = "text-muted border-line bg-white/[0.02]";
                if (currentRank === 1) {
                    tierLabel = "APEX_PREDATOR";
                    tierColor = "text-brand border-brand/50 bg-brand/10 shadow-[0_0_12px_rgba(225,29,72,0.15)]";
                } else if (currentRank <= 3) {
                    tierLabel = "ELITE_CLASS";
                    tierColor = "text-[#00F0FF] border-[#00F0FF]/40 bg-[#00F0FF]/5";
                } else if (currentRank <= 8) {
                    tierLabel = "HIGH_TIER";
                    tierColor = "text-[#FFE600] border-[#FFE600]/30 bg-[#FFE600]/5";
                }

                return (
                <div key={c.id} className="relative group overflow-hidden border border-line bg-card/40 hover:border-brand/40 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between p-5 rounded-md gap-4">
                    <div className="laser-sweep" />
                    
                    {/* Left: Rank & Avatar & Name */}
                    <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                        <div className="flex flex-col items-center justify-center shrink-0">
                           <div className="font-heading font-black italic text-4xl text-white/25 group-hover:text-brand transition-colors select-none leading-none">
                              #{currentRank.toString().padStart(2, '0')}
                           </div>
                           <span className={`text-[7px] font-mono font-bold mt-1 px-1.5 py-0.5 border rounded-sm leading-none ${tierColor}`}>
                              {tierLabel}
                           </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-black border border-line overflow-hidden shrink-0 shadow-md group-hover:border-brand/50 transition-colors">
                                <img 
                                    src={c.imageUrl || placeholder} 
                                    className="stockism-character-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => { e.currentTarget.src = placeholder; }}
                                />
                            </div>
                            <div>
                                <h4 className="font-heading text-xl font-bold leading-none text-white uppercase group-hover:text-brand transition-colors">{c.name}</h4>
                                <div className="text-[10px] text-muted font-mono mt-1 uppercase tracking-wider">{c.crew}</div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Trend & Score & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto relative z-10 border-t sm:border-t-0 border-line/40 pt-4 sm:pt-0">
                        {/* Movement Indicator */}
                        <div className="flex flex-col items-center">
                           <span className="text-[7px] font-heading font-black text-muted/40 uppercase tracking-widest mb-0.5">TREND</span>
                           <div className={`text-xs font-black font-mono ${moveColor} w-12 text-center`}>
                              {moveIcon}
                           </div>
                        </div>
                        
                        <div className="text-right min-w-[70px]">
                            <div className="text-2xl font-mono text-white font-black tracking-tight">{c.strengthVotes || 0}</div>
                            <div className="text-[7px] text-muted font-heading font-black tracking-widest uppercase">POWER INDEX</div>
                        </div>
                        <Button 
                            onClick={() => onVote(c.id)}
                            disabled={!settings.strongestVotingEnabled}
                            variant={settings.strongestVotingEnabled ? 'primary' : 'secondary'}
                            className="shadow-md !py-2.5 !px-6 text-[10px] tracking-widest font-heading font-black shrink-0"
                        >
                            VOTE
                        </Button>
                    </div>
                    
                    {/* Top Tier Ambient Backdrops */}
                    {currentRank === 1 && <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent pointer-events-none" />}
                    {currentRank <= 3 && currentRank > 1 && <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/5 via-transparent to-transparent pointer-events-none" />}
                </div>
              )})}
        </div>
    </div>
  );
});
