import React, { useState } from 'react';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, formatMoney } from '../../services/firebase';
import { Button } from '../ui/Button';
import { useToast } from './Toast';
import { useSound } from '../../hooks/useSound';
import { Pool } from '../../types';

interface PoolCardProps {
  pool: Pool;
  uid?: string;
  username?: string;
  cash?: number;
  onRefresh: () => void;
}

export const PoolCard: React.FC<PoolCardProps> = ({ pool, uid, username, cash = 0, onRefresh }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const sounds = useSound();

  const isEnded = pool.endsAt?.toDate?.() < new Date() || new Date(pool.endsAt) < new Date();
  const totalPool = pool.options.reduce((sum, o) => sum + o.totalBet, 0);

  const handleBet = async () => {
    if (!uid || !username || !selectedOption) return;
    const amount = parseFloat(betAmount);
    if (!amount || amount < pool.minBet || amount > pool.maxBet) {
      addToast({ message: `Bet must be between Φ${pool.minBet} and Φ${pool.maxBet}`, type: 'error' });
      return;
    }
    if (amount > cash) {
      addToast({ message: 'Insufficient funds', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      await runTransaction(db, async (txn) => {
        // ALL reads FIRST
        const userRef = doc(db, 'users', uid);
        const userSnap = await txn.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found');
        const userCash = userSnap.data().cash || 0;
        if (userCash < amount) throw new Error('Insufficient funds');

        const poolRef = doc(db, 'pools', pool.id);
        const poolSnap = await txn.get(poolRef);
        if (!poolSnap.exists()) throw new Error('Pool not found');
        const poolData = poolSnap.data() as Pool;

        // ALL writes after all reads
        txn.update(userRef, { cash: userCash - amount });

        const betRef = doc(collection(db, 'pools', pool.id, 'bets'));
        txn.set(betRef, { uid, username, optionId: selectedOption, amount, createdAt: serverTimestamp(), claimed: false });

        const updatedOptions = poolData.options.map(o =>
          o.id === selectedOption ? { ...o, totalBet: o.totalBet + amount, betCount: o.betCount + 1 } : o
        );
        txn.update(poolRef, { options: updatedOptions, totalPool: (poolData.totalPool || 0) + amount });
      });

      sounds.success();
      addToast({ message: `✅ Bet placed: Φ${formatMoney(amount)}`, type: 'success' });
      setBetAmount('');
      setSelectedOption(null);
      onRefresh();
    } catch (e: any) {
      sounds.error();
      addToast({ message: e.message, type: 'error' });
    } finally { setLoading(false); }
  };

  const getWinAmount = (optionId: string) => {
    const option = pool.options.find(o => o.id === optionId);
    if (!option || !option.totalBet || !totalPool) return 0;
    return Math.round((totalPool / option.totalBet) * parseFloat(betAmount || '0') * 100) / 100;
  };

  return (
    <div className={`premium-card p-5 rounded-lg relative overflow-hidden group ${isEnded ? 'opacity-60' : ''}`}>
      <div className="laser-sweep" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono text-brand font-bold uppercase tracking-widest">
          {pool.type} • {isEnded ? 'CLOSED' : 'OPEN'}
        </span>
        <span className="text-[8px] font-mono text-muted/50">
          Φ{formatMoney(totalPool)} pool
        </span>
      </div>

      <h3 className="text-sm font-heading font-black text-white uppercase tracking-tight mb-1">{pool.title}</h3>
      {pool.description && <p className="text-[10px] font-mono text-muted/60 mb-4">{pool.description}</p>}

      {!isEnded ? (
        <>
          <div className="space-y-2 mb-4">
            {pool.options.map(opt => {
              const pct = totalPool > 0 ? (opt.totalBet / totalPool) * 100 : 0;
              const isSelected = selectedOption === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left p-3 rounded-sm border transition-all ${
                    isSelected ? 'bg-brand/15 border-brand/50' : 'bg-black/30 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-white">{opt.label}</span>
                    <span className="text-[9px] font-mono text-muted">Φ{formatMoney(opt.totalBet)} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-1 bg-black/40 rounded overflow-hidden">
                    <div className="h-full bg-brand rounded transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>

          {uid && selectedOption && (
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <input
                  type="number"
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                  placeholder={`Φ${pool.minBet} - Φ${pool.maxBet}`}
                  className="w-full bg-black/60 border border-white/10 rounded-sm px-3 py-2 text-xs font-mono text-white focus:border-brand/50 focus:outline-none"
                  step="0.01"
                />
                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="text-[8px] font-mono text-muted/40 mt-1">
                    Potential win: <span className="text-good">Φ{formatMoney(getWinAmount(selectedOption))}</span>
                  </div>
                )}
              </div>
              <Button onClick={handleBet} disabled={loading || !betAmount} className="!py-2 !px-4 text-[9px] tracking-widest font-heading font-black shrink-0">
                {loading ? '...' : 'BET Φ'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Pool Closed</span>
          {pool.winningOptionId && (
            <div className="mt-2 text-xs font-mono text-good">
              Winner: {pool.options.find(o => o.id === pool.winningOptionId)?.label}
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-between text-[8px] font-mono text-muted/30">
        <span>{pool.options.length} options</span>
        <span>Ends: {pool.endsAt?.toDate?.()?.toLocaleString() || new Date(pool.endsAt).toLocaleString()}</span>
      </div>
    </div>
  );
};
