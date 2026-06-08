import React, { useMemo, useState } from 'react';
import { Character, GameSettings } from '../../types';
import { MarketCard } from './MarketCard';
import { Input, Select } from '../ui/Input';
import { CREWS } from '../../constants';

interface MarketProps {
  market: Character[];
  search: string;
  setSearch: (s: string) => void;
  onTrade: (c: Character) => void;
  onCardClick?: (c: Character) => void;
  settings: GameSettings;
  frozenIds: string[];
  recentSearches?: string[];
  onClearRecentSearches?: () => void;
}

export const Market: React.FC<MarketProps> = React.memo(({ market, search, setSearch, onTrade, onCardClick, settings, frozenIds, recentSearches, onClearRecentSearches }) => {
  const [crewFilter, setCrewFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  const filteredMarket = useMemo(() => {
    let res = market.filter(c => !c.isWaifu);
    
    // Filter
    const searchLower = search.toLowerCase();
    res = res.filter(c => 
      (c.name || "").toLowerCase().includes(searchLower) && 
      (crewFilter === "All" || (c.crew || "Unknown") === crewFilter)
    );

    // Sort
    if (sortBy === 'price') res.sort((a,b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'crew') res.sort((a,b) => (a.crew || "").localeCompare(b.crew || ""));
    else res.sort((a,b) => (a.name || "").localeCompare(b.name || ""));

    return res;
  }, [market, search, crewFilter, sortBy]);

  const multiplier = settings.event?.active ? settings.event.priceMultiplier : 1;
  const tradingEnabled = settings.tradingEnabled;

  return (
    <div className="space-y-8">
       {/* Premium Header with Animated Elements */}
       <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-brand/10 to-transparent border-l-4 border-brand p-8 shadow-2xl group border-gradient">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
               <div className="animate-fade-in-up">
                   <h2 className="text-5xl font-heading text-white italic tracking-tighter drop-shadow-lg">FIGHTER <span className="text-brand text-transparent bg-clip-text bg-gradient-to-r from-brand to-pink-500">EXCHANGE</span></h2>
                   <p className="text-xs text-brand/80 font-mono font-bold tracking-[0.3em] uppercase mt-2 pl-1 animate-slide-in-right">Tactical Asset Board • Underground Index</p>
               </div>
               <div className="flex items-center gap-3 animate-fade-in-up">
                   <div className="px-3 py-1 bg-brand/20 border border-brand/30 text-brand text-[10px] font-bold uppercase tracking-widest rounded-sm backdrop-blur-md shadow-lg animate-glow-pulse">
                       Active Protocol
                   </div>
                   <div className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest rounded-sm backdrop-blur-md">
                       {filteredMarket.length} Nodes
                   </div>
               </div>
           </div>
           
           {/* Decorative Elements */}
           <div className="absolute -right-10 -bottom-12 text-[12rem] text-brand/5 select-none font-heading italic pointer-events-none group-hover:scale-110 transition-transform duration-1000 ease-out animate-float">⚔</div>
           <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand/5 to-transparent pointer-events-none" />
           <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
           
           {/* Premium Accent Line Animation */}
           <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-brand via-brand/50 to-transparent animate-scanline" />
       </div>

       {/* Filter Bar with Glassmorphism */}
       <div className="flex flex-col md:flex-row gap-0 glass-panel border border-line p-0 overflow-hidden sticky top-4 z-30 shadow-xl rounded-sm animate-fade-in-up relative">
          <div className="relative flex-1">
            <Input 
              placeholder="SEARCH TARGET NODES..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              onFocus={() => {}}
              className="!bg-bg0/80 !backdrop-blur-md !border-0 !border-r !border-line focus:!ring-0 !rounded-none h-12 w-full" 
            />
            {/* Recent Searches Dropdown */}
            {search === '' && recentSearches && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-bg1/95 backdrop-blur-xl border border-line border-t-0 rounded-b-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-black/20">
                  <span className="text-[8px] font-heading font-black text-muted/50 uppercase tracking-widest">Recent Queries</span>
                  <button onClick={onClearRecentSearches} className="text-[8px] font-mono text-muted/40 hover:text-bad transition-colors">Clear</button>
                </div>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSearch(s)}
                    className="w-full text-left px-4 py-2.5 text-[11px] font-mono text-muted hover:bg-brand/10 hover:text-white transition-all border-b border-white/5 last:border-0 flex items-center gap-3"
                  >
                    <svg className="w-3 h-3 text-muted/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Select 
            value={crewFilter} 
            onChange={e => setCrewFilter(e.target.value)} 
            className="!bg-bg0/80 !backdrop-blur-md !border-0 !border-r !border-line min-w-[160px] h-12"
          >
             <option value="All">ALL CREWS</option>
             {CREWS.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)} 
            className="!bg-bg0/80 !backdrop-blur-md !border-0 !rounded-none min-w-[140px] h-12"
          >
             <option value="name">SORT: A-Z</option>
             <option value="price">SORT: PRICE</option>
             <option value="crew">SORT: CREW</option>
          </Select>
       </div>

      {/* Card Grid with Staggered Animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMarket.map((char, i) => (
          <MarketCard 
            key={char.id} 
            char={char}
            index={i}
            onTrade={onTrade}
            onCardClick={onCardClick}
            isFrozen={frozenIds.includes(char.id)}
            tradingEnabled={tradingEnabled}
            multiplier={multiplier}
          />
        ))}
        {filteredMarket.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel border-dashed border-2 border-line">
                <div className="text-4xl mb-4 grayscale opacity-20 animate-pulse">⚔</div>
                <div className="text-muted font-heading text-xl tracking-widest">NO TARGETS LOCATED</div>
            </div>
        )}
      </div>
    </div>
  );
});