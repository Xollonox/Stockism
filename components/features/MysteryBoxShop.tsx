import React, { useState } from 'react';
import { MYSTERY_BOXES, openMysteryBox } from '../../utils/gamification';
import { Button } from '../ui/Button';
import { useToast } from './Toast';
import { useSound } from '../../hooks/useSound';

interface MysteryBoxShopProps {
  uid: string;
  cash: number;
  onRefresh: () => void;
}

export const MysteryBoxShop: React.FC<MysteryBoxShopProps> = ({ uid, cash, onRefresh }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { addToast } = useToast();
  const sounds = useSound();

  const handleOpen = async (boxId: string) => {
    setLoading(boxId);
    try {
      const result = await openMysteryBox(uid, boxId);
      sounds.achievement();
      addToast({ message: `🎁 Opened! Reward: ${result.reward}`, type: 'success', duration: 5000 });
      onRefresh();
    } catch (e: any) {
      sounds.error();
      addToast({ message: e.message, type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {MYSTERY_BOXES.map(box => {
        const canAfford = cash >= box.cost;
        const isOpen = loading === box.id;
        return (
          <div
            key={box.id}
            className={`premium-card p-5 rounded-lg text-center relative overflow-hidden group transition-all ${
              canAfford ? 'hover:border-brand/30 cursor-pointer' : 'opacity-50'
            }`}
          >
            <div className="laser-sweep" />
            <div className="text-4xl mb-3 animate-float">{box.icon}</div>
            <div className="text-xs font-heading font-black text-white uppercase tracking-wider mb-1">{box.label}</div>
            <div className="text-[10px] font-mono text-muted/60 mb-3">Cost: Φ {box.cost.toLocaleString()}</div>
            <div className="text-[8px] font-mono text-muted/40 mb-4 space-y-0.5">
              {box.rewards.map((r, i) => <div key={i}>• {r}</div>)}
            </div>
            <Button
              onClick={() => handleOpen(box.id)}
              disabled={!canAfford || !!loading}
              className="w-full !py-2 text-[9px] tracking-widest font-heading font-black"
              variant={canAfford ? 'primary' : 'secondary'}
            >
              {isOpen ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  OPENING...
                </span>
              ) : `OPEN — Φ ${box.cost.toLocaleString()}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
};
