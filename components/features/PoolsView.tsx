import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Pool } from '../../types';
import { PoolCard } from './PoolCard';
import { SectionHeader, StatusBadge } from '../premium';

interface PoolsViewProps {
  uid?: string;
  username?: string;
  cash?: number;
}

export const PoolsView: React.FC<PoolsViewProps> = ({ uid, username, cash }) => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'pools'), orderBy('createdAt', 'desc')), (snap) => {
      const p: Pool[] = [];
      snap.forEach(d => p.push({ id: d.id, ...d.data() } as Pool));
      setPools(p);
    });
    return unsub;
  }, [refreshKey]);

  const active = pools.filter(p => !p.resolved);
  const resolved = pools.filter(p => p.resolved);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader title="Prediction Pools" subtitle="Bet on outcomes • Win big" />

      {active.length === 0 && resolved.length === 0 && (
        <div className="premium-card p-12 text-center rounded-lg">
          <div className="text-4xl mb-4 opacity-30">🎯</div>
          <div className="text-sm font-heading text-muted uppercase tracking-widest">No active pools</div>
          <div className="text-[10px] font-mono text-muted/50 mt-2">Admin will create prediction pools soon</div>
        </div>
      )}

      {active.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <StatusBadge status="active" label="Open Pools" />
            <span className="text-[9px] font-mono text-muted/50">{active.length} active</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map(pool => (
              <PoolCard key={pool.id} pool={pool} uid={uid} username={username} cash={cash} onRefresh={() => setRefreshKey(k => k + 1)} />
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4 mt-8">
            <StatusBadge status="locked" label="Resolved" />
            <span className="text-[9px] font-mono text-muted/50">{resolved.length} closed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resolved.map(pool => (
              <PoolCard key={pool.id} pool={pool} uid={uid} username={username} cash={cash} onRefresh={() => setRefreshKey(k => k + 1)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
