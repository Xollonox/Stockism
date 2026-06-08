import React, { useState } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../features/Toast';
import { CREWS, RARITIES } from '../../constants';

interface AdminToolsProps {
  market: any[];
}

export const AdminTools: React.FC<AdminToolsProps> = ({ market }) => {
  const [bulkInput, setBulkInput] = useState('');
  const [priceSchedChar, setPriceSchedChar] = useState('');
  const [priceSchedTarget, setPriceSchedTarget] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleBulkImport = async () => {
    setLoading(true);
    try {
      const lines = bulkInput.trim().split('\n').filter(Boolean);
      let count = 0;
      for (const line of lines) {
        // Format: Name | Crew | Rarity | Price | Tier | Gender (optional)
        const parts = line.split('|').map(s => s.trim());
        if (parts.length < 4) continue;
        const [name, crew, rarity, priceStr, tierStr, gender] = parts;
        const price = parseInt(priceStr) || 100;
        const tier = parseInt(tierStr) || 1;
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const slug = `char_${id}_${Date.now()}_${count}`;

        await setDoc(doc(db, 'characters', slug), {
          name,
          crew: CREWS.includes(crew) ? crew : CREWS[0],
          rarity: RARITIES.includes(rarity) ? rarity : 'Common',
          price,
          tier,
          gender: gender || 'Male',
          isWaifu: (gender || '').toLowerCase() === 'female',
          imageUrl: '',
          popularityVotes: 0,
          strengthVotes: 0,
          createdAt: serverTimestamp(),
        });
        count++;
      }
      addToast({ message: `Imported ${count} characters`, type: 'success' });
      setBulkInput('');
    } catch (e: any) {
      addToast({ message: `Import failed: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePrice = async () => {
    if (!priceSchedChar || !priceSchedTarget || !schedTime) return;
    setLoading(true);
    try {
      const char = market.find(c => c.id === priceSchedChar);
      if (!char) throw new Error('Character not found');
      
      await addDoc(collection(db, 'news'), {
        title: `Price Change: ${char.name}`,
        body: `Scheduled price adjustment to Φ ${parseInt(priceSchedTarget).toLocaleString()}`,
        type: 'character',
        relatedCharacterId: priceSchedChar,
        characterName: char.name,
        priceChange: parseInt(priceSchedTarget) - (char.price || 0),
        createdAt: serverTimestamp(),
        createdBy: 'Admin',
        priceImpact: ((parseInt(priceSchedTarget) - (char.price || 0)) / (char.price || 1)) * 100,
      });

      // Apply price change
      await updateDoc(doc(db, 'characters', priceSchedChar), {
        price: parseInt(priceSchedTarget),
        updatedAt: serverTimestamp(),
      });

      addToast({ message: `Price scheduled for ${char.name}`, type: 'success' });
    } catch (e: any) {
      addToast({ message: `Schedule failed: ${e.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Bulk Import */}
      <div className="premium-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-brand rounded-full animate-pulse" />
          <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.15em]">Bulk Character Import</h3>
        </div>
        <p className="text-[9px] font-mono text-muted/60 mb-3">
          Format: <span className="text-white">Name | Crew | Rarity | Price | Tier | Gender(optional)</span>
        </p>
        <textarea
          value={bulkInput}
          onChange={e => setBulkInput(e.target.value)}
          className="w-full h-32 bg-black/60 border border-white/10 rounded-lg p-4 text-[11px] font-mono text-white focus:border-brand/50 focus:outline-none transition-all resize-none"
          placeholder={`Gun Park | Workers | Mythic | 8900 | 10 | Male\nDaniel Park | Allied | Legendary | 5100 | 8 | Male\nMira Kim | Allied | Epic | 3200 | 5 | Female`}
        />
        <Button
          onClick={handleBulkImport}
          disabled={loading || !bulkInput.trim()}
          className="mt-3 w-full !py-2.5 text-[10px] tracking-widest font-heading font-black"
        >
          {loading ? 'IMPORTING...' : `IMPORT ${bulkInput.trim().split('\n').filter(Boolean).length} CHARACTERS`}
        </Button>
      </div>

      {/* Price Scheduler */}
      <div className="premium-card p-6 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-brand rounded-full animate-pulse" />
          <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.15em]">Price Scheduler</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={priceSchedChar}
            onChange={e => setPriceSchedChar(e.target.value)}
            className="bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-[11px] font-mono text-white focus:border-brand/50 focus:outline-none"
          >
            <option value="">Select character...</option>
            {market.map(c => <option key={c.id} value={c.id}>{c.name} — Φ {c.price?.toLocaleString()}</option>)}
          </select>
          <Input
            type="number"
            placeholder="Target price"
            value={priceSchedTarget}
            onChange={e => setPriceSchedTarget(e.target.value)}
            className="!bg-black/60 !border-white/10 font-mono text-xs"
          />
          <Input
            type="datetime-local"
            value={schedTime}
            onChange={e => setSchedTime(e.target.value)}
            className="!bg-black/60 !border-white/10 font-mono text-xs"
          />
        </div>
        <Button
          onClick={handleSchedulePrice}
          disabled={loading || !priceSchedChar || !priceSchedTarget}
          className="mt-3 w-full !py-2.5 text-[10px] tracking-widest font-heading font-black"
        >
          {loading ? 'SCHEDULING...' : 'SCHEDULE PRICE CHANGE'}
        </Button>
      </div>
    </div>
  );
};
