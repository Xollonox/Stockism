import React, { useState } from 'react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../features/Toast';

export const PoolCreator: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [minBet, setMinBet] = useState('10');
  const [maxBet, setMaxBet] = useState('10000');
  const [duration, setDuration] = useState('60');
  const [type, setType] = useState<'match' | 'event' | 'prediction'>('prediction');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const addOption = () => setOptions([...options, '']);
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => {
    const copy = [...options]; copy[i] = val; setOptions(copy);
  };

  const handleCreate = async () => {
    if (!title.trim() || options.some(o => !o.trim())) {
      addToast({ message: 'Fill in title and all options', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const poolData = {
        title: title.trim(),
        description: description.trim(),
        options: options.filter(o => o.trim()).map((label, i) => ({
          id: `opt_${i}`,
          label: label.trim(),
          totalBet: 0,
          betCount: 0,
        })),
        createdBy: 'Admin',
        createdAt: serverTimestamp(),
        endsAt: new Date(Date.now() + parseInt(duration) * 60000),
        resolved: false,
        type,
        minBet: parseFloat(minBet) || 10,
        maxBet: parseFloat(maxBet) || 10000,
        totalPool: 0,
      };
      await addDoc(collection(db, 'pools'), poolData);
      addToast({ message: 'Pool created successfully', type: 'success' });
      setTitle(''); setDescription(''); setOptions(['', '']);
    } catch (e: any) {
      addToast({ message: `Failed: ${e.message}`, type: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <div className="premium-card p-6 rounded-lg space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 bg-brand rounded-full animate-pulse" />
        <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.15em]">Create Prediction Pool</h3>
      </div>

      <Input label="Pool Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Who will win?" className="!bg-black/60 !border-white/10 font-mono text-xs" />
      <Input label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details about this pool..." className="!bg-black/60 !border-white/10 font-mono text-xs" />

      <div className="space-y-2">
        <label className="text-[9px] font-heading font-black text-muted uppercase tracking-widest">Betting Options</label>
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="!bg-black/60 !border-white/10 font-mono text-xs flex-1" />
            {options.length > 2 && <button onClick={() => removeOption(i)} className="text-bad hover:text-white text-xs px-2">✕</button>}
          </div>
        ))}
        <Button variant="ghost" onClick={addOption} className="text-[9px] !py-1">+ Add Option</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Input label="Min Bet (Φ)" type="number" value={minBet} onChange={e => setMinBet(e.target.value)} className="!bg-black/60 !border-white/10 font-mono text-xs" />
        <Input label="Max Bet (Φ)" type="number" value={maxBet} onChange={e => setMaxBet(e.target.value)} className="!bg-black/60 !border-white/10 font-mono text-xs" />
        <Input label="Duration (min)" type="number" value={duration} onChange={e => setDuration(e.target.value)} className="!bg-black/60 !border-white/10 font-mono text-xs" />
      </div>

      <div className="flex gap-2">
        {(['prediction', 'match', 'event'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 text-[9px] font-heading font-black uppercase tracking-widest rounded-sm border transition-all ${type === t ? 'bg-brand/20 border-brand/50 text-white' : 'bg-black/40 border-white/10 text-muted hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      <Button onClick={handleCreate} disabled={loading} className="w-full !py-3 text-[10px] tracking-widest font-heading font-black">
        {loading ? 'CREATING POOL...' : 'CREATE PREDICTION POOL'}
      </Button>
    </div>
  );
};
