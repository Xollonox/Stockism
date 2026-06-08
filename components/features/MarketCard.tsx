import React, { memo, useState, useRef, useCallback } from 'react';
import { Character } from '../../types';
import { Button } from '../ui/Button';
import { formatMoney } from '../../services/firebase';

interface MarketCardProps {
  char: Character;
  onTrade: (char: Character) => void;
  isFrozen: boolean;
  tradingEnabled: boolean;
  multiplier?: number;
  index?: number;
}

export const MarketCard = memo(({ char, onTrade, isFrozen, tradingEnabled, multiplier = 1, index = 0 }: MarketCardProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const name = char.name || "Unknown";
  const initial = (name).charAt(0).toUpperCase();
  const price = Number(char.price) || 0;
  const displayPrice = price * (Number(multiplier) || 1);
  const crew = char.crew || "Independent";
  const rarity = char.rarity || 'Common';

  const placeholder = "/assets/placeholder-character.png";

  const getRarityStyles = (r: string) => {
    switch(r) {
        case 'Mythic':
            return {
                border: 'border-red-500/40 group-hover:border-red-400/80',
                glow: 'shadow-[0_0_25px_-8px_rgba(239,68,68,0.3)] group-hover:shadow-[0_0_50px_-8px_rgba(239,68,68,0.6)]',
                badge: 'bg-red-950/80 text-red-200 border-red-500/40 shadow-[0_0_12px_rgba(220,38,38,0.2)]',
                inset: 'rgba(239, 68, 68, 0.08)',
                accent: 'text-red-400',
                glowClass: 'rarity-mythic',
                gradient: 'from-red-500/10'
            };
        case 'Legendary':
            return {
                border: 'border-amber-400/30 group-hover:border-amber-300/70',
                glow: 'shadow-[0_0_20px_-8px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_45px_-8px_rgba(245,158,11,0.5)]',
                badge: 'bg-amber-950/80 text-amber-100 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
                inset: 'rgba(251, 191, 36, 0.06)',
                accent: 'text-amber-400',
                glowClass: 'rarity-legendary',
                gradient: 'from-amber-500/10'
            };
        case 'Epic':
            return {
                border: 'border-fuchsia-500/30 group-hover:border-fuchsia-400/70',
                glow: 'shadow-[0_0_20px_-10px_rgba(192,38,211,0.2)] group-hover:shadow-[0_0_40px_-10px_rgba(192,38,211,0.4)]',
                badge: 'bg-fuchsia-950/80 text-fuchsia-100 border-fuchsia-500/30 shadow-[0_0_10px_rgba(192,38,211,0.15)]',
                inset: 'rgba(192, 38, 211, 0.05)',
                accent: 'text-fuchsia-400',
                glowClass: 'rarity-epic',
                gradient: 'from-fuchsia-500/10'
            };
        case 'Rare':
            return {
                border: 'border-blue-500/25 group-hover:border-blue-400/60',
                glow: 'shadow-[0_0_15px_-10px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_35px_-10px_rgba(59,130,246,0.35)]',
                badge: 'bg-blue-950/80 text-blue-100 border-blue-500/20',
                inset: 'rgba(59, 130, 246, 0.04)',
                accent: 'text-blue-400',
                glowClass: 'rarity-rare',
                gradient: 'from-blue-500/10'
            };
        default:
            return {
                border: 'border-white/5 group-hover:border-white/30',
                glow: 'shadow-none group-hover:shadow-[0_0_25px_-10px_rgba(255,255,255,0.15)]',
                badge: 'bg-zinc-900/90 text-zinc-400 border-zinc-700/40',
                inset: 'rgba(255, 255, 255, 0.02)',
                accent: 'text-zinc-400',
                glowClass: '',
                gradient: 'from-white/5'
            };
    }
  };

  const styles = getRarityStyles(rarity);

  // 3D Tilt Handler
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    cardRef.current.style.setProperty('--rotateX', `${rotateX}deg`);
    cardRef.current.style.setProperty('--rotateY', `${rotateY}deg`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rotateX', '0deg');
    cardRef.current.style.setProperty('--rotateY', '0deg');
  }, []);

  return (
    <div 
      className={`card-3d animate-slide-up stagger-${Math.min(index + 1, 8)}`}
      ref={cardRef as any}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        className={`character-card card-3d-inner group relative flex flex-col h-full bg-card/60 backdrop-blur-2xl border ${styles.border} ${styles.glow} transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden rounded-md hover:-translate-y-2 active:scale-[0.98]`}
        style={{ 
          boxShadow: `0 0 0 1px inset ${styles.inset}`,
        }}
      >
        {/* Premium Glass Reflection */}
        <div className="glass-gloss absolute inset-0 pointer-events-none z-[25]" />
        
        <div className="laser-sweep" />
        
        {/* Rare Sparkle Particles */}
        <div className="particle-container opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="particle"
              style={{
                top: `${15 + i * 25}%`,
                left: `${10 + i * 30}%`,
                '--duration': `${1.2 + i * 0.3}s`,
                '--delay': `${i * 0.2}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      
        <div className="flex justify-between items-center px-4 py-2 bg-black/40 border-b border-white/5 backdrop-blur-md z-30 relative font-mono text-[9px]">
           <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isFrozen ? 'bg-warn animate-pulse' : 'bg-good shadow-[0_0_8px_var(--color-good)]'}`} />
              <span className="text-white/40 uppercase tracking-[0.2em] font-bold">NODE_{char.tier || 1}</span>
           </div>
           <span className="text-white/20 tracking-widest font-bold">ARC_{char.id.substring(0,4).toUpperCase()}</span>
        </div>

        <div className="relative aspect-[4/5] w-full bg-bg0 overflow-hidden">
          {/* Centered Initial Letter Watermark */}
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-0">
              <span className="text-8xl font-heading font-black text-white/[0.02] select-none transform -rotate-12 scale-150">{initial}</span>
          </div>

          {/* Radial Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.5)_100%)] z-10 pointer-events-none" />
          
          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          
          {/* Hologram Scanner Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

          {/* 3D Depth Shadow */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[15] pointer-events-none" />

          <img 
            src={char.imageUrl || placeholder} 
            alt={name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => { e.currentTarget.src = placeholder; setImgLoaded(true); }}
            className={`stockism-character-image relative z-0 w-full h-full object-cover transition-all duration-700 ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
            style={{
              filter: imgLoaded ? undefined : 'grayscale(100%) blur(2px)',
            }}
          />
          
          {/* Gradient Feets */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg0 via-transparent to-black/20 z-10 pointer-events-none" />
          
          {/* Rarity Badge & Multiplier */}
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
              <span className={`text-[8px] font-heading font-black uppercase px-2 py-0.5 tracking-[0.15em] backdrop-blur-xl border ${styles.badge} transition-all duration-500 group-hover:scale-105 group-hover:shadow-lg rounded-sm`}>
                  {rarity}
              </span>
               {multiplier !== 1 && (
                  <div className="bg-brand text-white text-[9px] font-heading font-black px-2 py-0.5 tracking-wider flex items-center justify-center shadow-xl border border-brand/40 animate-zoom-in rounded-sm">
                    x{multiplier}
                  </div>
               )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 z-20 pointer-events-none transform translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:translate-y-0">
              <div className={`text-[9px] font-heading font-semibold ${styles.accent} uppercase tracking-[0.25em] mb-1 pl-0.5 opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:tracking-[0.35em]`}>{crew}</div>
              <h3 className="font-heading text-3xl leading-none text-white italic tracking-tighter drop-shadow-2xl transition-all duration-500 group-hover:scale-[1.03] group-hover:text-glow origin-left">{name}</h3>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 flex-1 justify-end bg-white/[0.005] backdrop-blur-2xl relative border-t border-white/5 group-hover:bg-white/[0.015] transition-colors duration-500">
          <div className="flex justify-between items-end">
               <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-muted font-heading font-black uppercase tracking-[0.15em] opacity-40">Valuation</span>
                  <span className={`text-2xl font-mono text-white font-black flex items-center gap-1 leading-none tracking-tight transition-all duration-300 ${priceFlash === 'up' ? 'text-good price-up' : priceFlash === 'down' ? 'text-bad price-down' : ''}`}>
                      <span className="text-brand text-base opacity-75">Φ</span>
                      {formatMoney(displayPrice)}
                  </span>
               </div>
               <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[9px] text-muted font-heading font-black uppercase tracking-[0.15em] opacity-40">Status</span>
                  <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-sm tracking-widest transition-all duration-300 ${isFrozen ? 'bg-warn/10 text-warn border border-warn/25 shadow-[0_0_8px_rgba(245,158,11,0.1)]' : 'bg-good/10 text-good border border-good/25 shadow-[0_0_8px_rgba(16,185,129,0.1)]'}`}>
                    {isFrozen ? 'LOCKED' : 'ACTIVE'}
                  </span>
               </div>
          </div>

          <Button 
            onClick={() => onTrade(char)} 
            disabled={!tradingEnabled || isFrozen}
            className={`w-full !py-3 font-heading font-black tracking-widest text-[10px] shadow-xl transition-all duration-300 ${
              isFrozen 
                ? 'grayscale opacity-40' 
                : 'opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] hover:shadow-[0_0_25px_var(--color-brand)]'
            }`}
            variant={isFrozen ? 'secondary' : 'primary'}
          >
            {isFrozen ? 'PROTOCOL_LOCKED' : 'EXECUTE_TRADE'}
          </Button>
        </div>

        {/* Animated Rarity Border Overlay */}
        <div className={`absolute inset-0 border-[1px] ${styles.border} opacity-0 group-hover:opacity-25 pointer-events-none transition-opacity duration-500 rounded-md`} />
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.char.id === next.char.id &&
    prev.char.price === next.char.price &&
    prev.char.name === next.char.name &&
    prev.char.imageUrl === next.char.imageUrl &&
    prev.isFrozen === next.isFrozen &&
    prev.tradingEnabled === next.tradingEnabled &&
    prev.multiplier === next.multiplier &&
    prev.index === next.index
  );
});
