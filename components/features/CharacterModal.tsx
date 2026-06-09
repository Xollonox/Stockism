import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { formatMoney } from '../../services/firebase';
import { CandlestickChart, pricesToCandles } from './PriceChart';

interface CharacterModalProps {
  char: any;
  onClose: () => void;
  onTrade: (char: any) => void;
  holdings: number;
  priceHistory?: { time: number; price: number }[];
}

export const CharacterModal: React.FC<CharacterModalProps> = ({ char, onClose, onTrade, holdings, priceHistory }) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'info'>('chart');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const rarityColor = (r: string) => {
    switch(r) {
      case 'Mythic': return 'text-red-400 border-red-500/40';
      case 'Legendary': return 'text-amber-400 border-amber-500/30';
      case 'Epic': return 'text-fuchsia-400 border-fuchsia-500/30';
      case 'Rare': return 'text-blue-400 border-blue-500/25';
      default: return 'text-zinc-400 border-zinc-700/40';
    }
  };

  // Generate mock price history if none provided
  const mockHistory = priceHistory || Array.from({ length: 24 }, (_, i) => ({
    time: Date.now() - (24 - i) * 3600000,
    price: (char.price || 1000) * (0.85 + Math.random() * 0.3),
  }));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-2xl glass-panel border border-line rounded-md overflow-hidden animate-zoom-in" style={{ maxHeight: '90vh' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 flex items-center justify-center bg-black/50 border border-line text-muted hover:text-white hover:border-brand rounded-sm transition-all text-sm font-mono"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row max-h-[90vh] overflow-y-auto custom-scrollbar">
          {/* Left: Image */}
          <div className="w-full md:w-1/3 relative bg-bg0 min-h-[250px] md:min-h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bg0/80 z-10 pointer-events-none" />
            <img
              src={char.imageUrl || '/assets/placeholder-character.png'}
              alt={char.name}
              className="w-full h-full object-cover absolute inset-0"
              onError={(e) => { e.currentTarget.src = ''; }}
            />
            <div className="absolute bottom-4 left-4 z-20">
              <div className={`text-[9px] font-heading font-black uppercase px-2 py-0.5 border ${rarityColor(char.rarity)} bg-black/80 backdrop-blur-md inline-block rounded-sm`}>
                {char.rarity || 'Common'}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 p-6 md:p-8">
            {/* Header */}
            <div className="mb-4">
              <div className="text-[10px] font-mono text-brand/60 font-bold tracking-[0.25em] uppercase mb-1">{char.crew || 'Independent'}</div>
              <h2 className="text-3xl font-heading text-white italic tracking-tighter">{char.name}</h2>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4 mb-6 p-4 bg-black/30 border border-line rounded-sm">
              <div>
                <div className="text-[9px] font-heading font-black text-muted uppercase tracking-[0.15em] mb-1">Current Valuation</div>
                <div className="text-3xl font-mono text-white font-black flex items-center gap-1">
                  <span className="text-brand text-lg">Φ</span>
                  {formatMoney(char.price || 0)}
                </div>
              </div>
              {holdings > 0 && (
                <div className="text-right">
                  <div className="text-[9px] font-heading font-black text-muted uppercase tracking-[0.15em] mb-1">Your Holdings</div>
                  <div className="text-lg font-mono text-good font-black">{holdings} shares</div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 p-1 bg-black/20 border border-line rounded-sm">
              <button
                onClick={() => setActiveTab('chart')}
                className={`flex-1 py-2 text-[10px] font-heading font-black uppercase tracking-widest transition-all rounded-sm ${activeTab === 'chart' ? 'bg-brand/20 text-white' : 'text-muted hover:text-white'}`}
              >
                Price Chart
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-[10px] font-heading font-black uppercase tracking-widest transition-all rounded-sm ${activeTab === 'info' ? 'bg-brand/20 text-white' : 'text-muted hover:text-white'}`}
              >
                Intel
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'chart' ? (
              <div className="p-4 bg-black/20 border border-line rounded-sm">
                <CandlestickChart data={pricesToCandles(mockHistory)} width={280} height={100} />
                <div className="flex justify-between text-[8px] font-mono text-muted/50 mt-2">
                  <span>24h ago</span>
                  <span>Now</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-black/20 border border-line rounded-sm font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Rarity</span>
                  <span className={`font-bold ${rarityColor(char.rarity).split(' ')[0]}`}>{char.rarity || 'Common'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Crew</span>
                  <span className="text-white font-bold">{char.crew || 'Independent'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Tier</span>
                  <span className="text-white font-bold">NODE_{char.tier || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Holders</span>
                  <span className="text-white font-bold">{char.holdersCount || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">All-Time High</span>
                  <span className="text-white font-bold">Φ {formatMoney(char.allTimeHigh || char.price || 0)}</span>
                </div>
              </div>
            )}

            {/* Trade Button */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                onClick={() => { onTrade(char); onClose(); }}
                className="w-full font-heading font-black text-[10px] tracking-widest !py-3"
                variant="primary"
              >
                BUY SHARES
              </Button>
              {holdings > 0 && (
                <Button
                  onClick={() => { onTrade(char); onClose(); }}
                  className="w-full font-heading font-black text-[10px] tracking-widest !py-3"
                  variant="secondary"
                >
                  SELL SHARES
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
