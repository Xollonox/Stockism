import React, { useState, useEffect } from 'react';
import { db, slugify, formatMoney, formatTime, auth } from '../../services/firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, limit, serverTimestamp, addDoc, orderBy, writeBatch } from 'firebase/firestore';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { GameSettings, Character } from '../../types';
import { CREWS, RARITIES, ADMIN_EMAIL } from '../../constants';

interface AdminPanelProps {
  settings: GameSettings;
  market: Character[];
  isMainAdmin: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ settings, market, isMainAdmin }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MARKET' | 'USERS' | 'NEWS' | 'EVENTS'>('GENERAL');
  
  const placeholder = "/assets/placeholder-character.png";

  // Market State
  const [newCharName, setNewCharName] = useState('');
  const [newCharPrice, setNewCharPrice] = useState('100');
  const [newCharCrew, setNewCharCrew] = useState(CREWS[0]);
  const [newCharRarity, setNewCharRarity] = useState(RARITIES[0]);
  const [newCharGender, setNewCharGender] = useState<'Male'|'Female'>('Male');
  const [newCharImageUrl, setNewCharImageUrl] = useState('');
  const [newCharIsWaifu, setNewCharIsWaifu] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [editName, setEditName] = useState('');
  const [editCrew, setEditCrew] = useState('');
  const [editRarity, setEditRarity] = useState('');
  const [editGender, setEditGender] = useState<'Male'|'Female'>('Male');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsWaifu, setEditIsWaifu] = useState(false);
  
  // User State
  const [userSearch, setUserSearch] = useState('');
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [cashAmount, setCashAmount] = useState('');

  // News State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsType, setNewsType] = useState<'market' | 'character' | 'event' | 'system'>('system');
  const [newsCharId, setNewsCharId] = useState('');
  const [newsPriceChange, setNewsPriceChange] = useState('');

  // Event State
  const [eventName, setEventName] = useState(settings.event?.name || '');
  const [eventMult, setEventMult] = useState(settings.event?.priceMultiplier?.toString() || '1.0');



  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchRecentUsers();
    }
  }, [activeTab]);

  const updateSetting = async (key: string, value: any) => {
    try {
      await setDoc(doc(db, 'game', 'settings'), { [key]: value }, { merge: true });
    } catch (e: any) {
      console.error("Error updating settings:", e.message);
    }
  };



  const handleAddCharacter = async () => {
    if (!newCharName || !newCharPrice) return;
    
    setIsSaving(true);
    try {
        const id = slugify(newCharName);
        await setDoc(doc(db, 'characters', id), {
          name: newCharName,
          price: parseInt(newCharPrice),
          crew: newCharCrew,
          rarity: newCharRarity,
          tier: 1,
          gender: newCharIsWaifu ? 'Female' : newCharGender,
          imageUrl: newCharImageUrl.trim(),
          isWaifu: newCharIsWaifu,
          popularityVotes: 0,
          strengthVotes: 0, 
          updatedAt: serverTimestamp()
        });
        setNewCharName('');
        setNewCharPrice('100');
        setNewCharImageUrl('');
    } catch(e: any) {
        console.error("Character add error:", e.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleUpdateDetails = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (!selectedChar) return;
    
    setIsSaving(true);
    try {
        const updateData: any = {
            name: editName.trim(),
            crew: editCrew || CREWS[0],
            rarity: editRarity || RARITIES[0],
            isWaifu: editIsWaifu,
            gender: editIsWaifu ? 'Female' : editGender,
            updatedAt: serverTimestamp()
        };
        if (editImageUrl && editImageUrl.trim() !== "") {
            updateData.imageUrl = editImageUrl.trim();
        }
        await updateDoc(doc(db, 'characters', selectedChar.id), updateData);
        setSelectedChar(null);
    } catch (err: any) {
        console.error("Update error:", err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handlePriceUpdate = async (mode: 'SET' | 'DELTA') => {
    if (!selectedChar) return;
    const val = parseInt(priceAdjustment);
    if (isNaN(val)) return;

    const current = Number(selectedChar.price) || 0;
    let final = mode === 'SET' ? val : current + val;
    if (final < 1) final = 1;

    try {
        await updateDoc(doc(db, 'characters', selectedChar.id), {
            price: final,
            updatedAt: serverTimestamp()
        });
        setPriceAdjustment('');
    } catch (e: any) {
        console.error("Price adjustment error:", e.message);
    }
  };

  const handleToggleFreeze = async (id: string) => {
    const current = settings.frozenCharacters || [];
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    updateSetting('frozenCharacters', updated);
  };

  const handleDeleteChar = async (id: string) => {
    if(confirm(`Purge character node ${id}?`)) await deleteDoc(doc(db, 'characters', id));
  };

  const fetchRecentUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      const users: any[] = [];
      for (const d of snap.docs) {
         const privateData = d.data();
         const publicSnap = await getDoc(doc(db, 'users_public', d.id));
         const publicData = publicSnap.exists() ? publicSnap.data() : {};
         users.push({ id: d.id, ...privateData, ...publicData });
      }
      setUserList(users);
    } catch (e: any) {
      console.error("User list error:", e);
    }
  };

  const handleSearchUsers = async () => {
    if (!userSearch) {
        fetchRecentUsers();
        return;
    }
    try {
        let users: any[] = [];
        const uidDoc = await getDoc(doc(db, 'users', userSearch));
        if (uidDoc.exists()) {
            const pubDoc = await getDoc(doc(db, 'users_public', userSearch));
            users.push({ id: userSearch, ...uidDoc.data(), ...(pubDoc.exists() ? pubDoc.data() : {}) });
        } else {
             const emailQ = query(collection(db, 'users'), where('email', '>=', userSearch), where('email', '<=', userSearch + '\uf8ff'), limit(5));
             const emailSnap = await getDocs(emailQ);
             for (const d of emailSnap.docs) {
                const pubDoc = await getDoc(doc(db, 'users_public', d.id));
                users.push({ id: d.id, ...d.data(), ...(pubDoc.exists() ? pubDoc.data() : {}) });
             }
        }
        setUserList(users);
    } catch (e: any) {
        console.error("Search error:", e.message);
    }
  };

  const handleUpdateCash = async (amount: number) => {
    if (!selectedUser) return;
    const newCash = (selectedUser.cash || 0) + amount;
    const newNetWorth = (selectedUser.netWorth || 0) + amount;
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', selectedUser.id), { cash: newCash }),
        updateDoc(doc(db, 'users_public', selectedUser.id), { 
          netWorth: newNetWorth, 
          liquidPhi: newCash,
          updatedAt: serverTimestamp() 
        })
      ]);
      setSelectedUser({ ...selectedUser, cash: newCash, netWorth: newNetWorth, liquidPhi: newCash });
      fetchRecentUsers();
    } catch (e: any) {
      console.error("Liquidity update error:", e.message);
    }
  };

  const handleBanToggle = async () => {
    if (!selectedUser) return;
    if (selectedUser.email === ADMIN_EMAIL) return;
    const newVal = !selectedUser.isBanned;
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', selectedUser.id), { isBanned: newVal }),
        updateDoc(doc(db, 'users_public', selectedUser.id), { isBanned: newVal, updatedAt: serverTimestamp() })
      ]);
      setSelectedUser({ ...selectedUser, isBanned: newVal });
      fetchRecentUsers();
    } catch (e: any) { console.error("Ban toggle error:", e.message); }
  };

  const handleSetRole = async (role: any) => {
    if (!isMainAdmin || !selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), { role });
      setSelectedUser({ ...selectedUser, role });
      fetchRecentUsers();
    } catch (e: any) { console.error("Role update error:", e.message); }
  };

  const handlePostNews = async () => {
    if (!newsTitle || !newsBody) return;
    let charName = "";
    if (newsCharId) {
        const c = market.find(x => x.id === newsCharId);
        if(c) charName = c.name;
    }
    try {
        await addDoc(collection(db, 'news'), {
            title: newsTitle,
            body: newsBody,
            type: newsType,
            relatedCharacterId: newsCharId || null,
            characterName: charName || null,
            priceChange: newsPriceChange ? parseInt(newsPriceChange) : 0,
            createdAt: serverTimestamp(),
            createdBy: isMainAdmin ? "Main Admin" : "Worker"
        });
        setNewsTitle('');
        setNewsBody('');
        setNewsPriceChange('');
    } catch(e: any) {
        console.error("News post failed:", e.message);
    }
  };

  const handleSaveEvent = async () => {
    updateSetting('event', {
      active: true,
      name: eventName,
      description: "Admin Protocol",
      priceMultiplier: parseFloat(eventMult)
    });
  };

  const stopEvent = async () => {
    updateSetting('event', { active: false });
  };

  return (
    <div className="space-y-6">
      {/* Premium Slanted Console Tabs */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-md overflow-x-auto border border-line">
        {['GENERAL', 'MARKET', 'USERS', 'NEWS', 'EVENTS'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 px-4 text-[10px] font-heading font-black tracking-widest transition-all whitespace-nowrap skew-x-[-10deg] border ${
                isActive 
                  ? 'bg-brand text-white border-brand shadow-[0_0_15px_rgba(225,29,72,0.25)]' 
                  : 'bg-black/40 text-muted border-line hover:text-white hover:bg-black/60'
              }`}
            >
              <span className="inline-block skew-x-[10deg]">{tab.replace('_', ' ')}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'GENERAL' && (
        <div className="glass-panel p-6 rounded-md space-y-4 animate-fade-in-up border border-line relative overflow-hidden group">
          <div className="laser-sweep" />
          <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em] mb-4">[ GLOBAL_CONTROL_VAULT ]</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant={settings.tradingEnabled ? 'success' : 'danger'} onClick={() => updateSetting('tradingEnabled', !settings.tradingEnabled)} className="font-heading font-black text-[10px] tracking-widest !py-3">
               Trading Protocol: {settings.tradingEnabled ? 'ACTIVE' : 'PAUSED'}
            </Button>
            <Button variant={settings.popularityVotingEnabled ? 'success' : 'secondary'} onClick={() => updateSetting('popularityVotingEnabled', !settings.popularityVotingEnabled)} className="font-heading font-black text-[10px] tracking-widest !py-3">
               Reputation Vote: {settings.popularityVotingEnabled ? 'ONLINE' : 'LOCKED'}
            </Button>
            <Button variant={settings.strongestVotingEnabled ? 'success' : 'secondary'} onClick={() => updateSetting('strongestVotingEnabled', !settings.strongestVotingEnabled)} className="font-heading font-black text-[10px] tracking-widest !py-3">
               Strength Vote: {settings.strongestVotingEnabled ? 'ONLINE' : 'LOCKED'}
            </Button>
            <Input label="Market Ticker Message" defaultValue={settings.marketMessage} onBlur={(e: any) => updateSetting('marketMessage', e.target.value)} className="font-mono text-xs" />
            <Input label="Logo / Banner Image URL" defaultValue={settings.bannerImageUrl} onBlur={(e: any) => updateSetting('bannerImageUrl', e.target.value)} className="font-mono text-xs" />
            <Input label="Order Cooldown (seconds)" type="number" defaultValue={settings.cooldownSeconds} onBlur={(e: any) => updateSetting('cooldownSeconds', parseInt(e.target.value))} className="font-mono text-xs" />
          </div>
        </div>
      )}

      {activeTab === 'MARKET' && (
        <div className="space-y-6 animate-fade-in-up">
          {selectedChar ? (
            <div className="glass-panel p-6 rounded-md border border-brand/40 shadow-xl relative overflow-hidden group">
                <div className="laser-sweep" />
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em]">[ NODE_CONFIG_MATRIX ]</h3>
                    <Button variant="ghost" onClick={() => setSelectedChar(null)} className="h-8 w-8 !p-0 font-bold border border-line rounded">✕</Button>
                </div>
                <div className="space-y-6">
                    <div className="p-5 bg-black/45 border border-line rounded-sm space-y-4">
                        <span className="text-[9px] font-heading font-black text-brand tracking-widest uppercase block mb-1">Target Name: {selectedChar.name}</span>
                        <Input label="Callsign Name" value={editName} onChange={e => setEditName(e.target.value)} className="font-mono text-xs" />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Crew / Affiliation" value={editCrew} onChange={e => setEditCrew(e.target.value)} className="font-mono text-xs">
                                {CREWS.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                            <Select label="Rarity Grade" value={editRarity} onChange={e => setEditRarity(e.target.value)} className="font-mono text-xs">
                                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                            </Select>
                        </div>
                        <Input label="Image Node URL" value={editImageUrl} onChange={e => setEditImageUrl(e.target.value)} className="font-mono text-xs" />
                        <Button onClick={handleUpdateDetails} disabled={isSaving} className="w-full font-heading font-black tracking-widest text-[10px] !py-3">COMMIT TARGET CONFIG</Button>
                    </div>
                    <div className="p-5 bg-black/45 border border-line rounded-sm space-y-4">
                        <h4 className="text-[9px] font-heading font-black text-brand tracking-widest uppercase">[ VALUATION_INDEX_ADJUST ]</h4>
                        <Input label="Target Value (Φ)" type="number" value={priceAdjustment} onChange={e => setPriceAdjustment(e.target.value)} className="font-mono text-xs" />
                        <div className="grid grid-cols-2 gap-3">
                            <Button onClick={() => handlePriceUpdate('SET')} className="font-heading font-black text-[10px] tracking-widest">SET EXACT VALUE</Button>
                            <Button onClick={() => handlePriceUpdate('DELTA')} variant="secondary" className="font-heading font-black text-[10px] tracking-widest">ADJUST (DELTAS)</Button>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-md border border-line relative overflow-hidden group">
                <div className="laser-sweep" />
                <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em] mb-4">[ INITIALIZE_NEW_ROSTER_NODE ]</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Fighter Name" value={newCharName} onChange={e => setNewCharName(e.target.value)} className="font-mono text-xs" />
                    <Input label="Initial Valuation (Φ)" type="number" value={newCharPrice} onChange={e => setNewCharPrice(e.target.value)} className="font-mono text-xs" />
                    <Select label="Crew / Affiliation" value={newCharCrew} onChange={e => setNewCharCrew(e.target.value)} className="font-mono text-xs">
                        {CREWS.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Select label="Rarity Grade" value={newCharRarity} onChange={e => setNewCharRarity(e.target.value)} className="font-mono text-xs">
                        {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                    <Input label="Image Node URL" value={newCharImageUrl} onChange={e => setNewCharImageUrl(e.target.value)} className="col-span-1 md:col-span-2 font-mono text-xs" />
                    <Button onClick={handleAddCharacter} className="col-span-1 md:col-span-2 mt-2 font-heading font-black text-[10px] tracking-widest !py-3" disabled={isSaving}>INITIALIZE ASSET NODE</Button>
                </div>
            </div>
          )}

          <div className="glass-panel p-6 rounded-md border border-line relative overflow-hidden group">
            <div className="laser-sweep" />
            <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em] mb-4">[ ACTIVE_ROSTER_INDEX ({market.length}) ]</h3>
            <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {market.map(c => (
                <div key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-black/45 border border-line text-xs rounded hover:bg-black/60 transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-black overflow-hidden shrink-0 border border-line">
                      <img src={c.imageUrl || placeholder} className="w-full h-full object-cover" onError={(e: any) => { e.currentTarget.src = placeholder; }} />
                    </div>
                    <div>
                      <div className="font-bold text-white uppercase tracking-wider">{c.name}</div>
                      <div className="text-[10px] text-muted font-mono">{c.crew} • Φ {formatMoney(c.price)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button onClick={() => { setSelectedChar(c); setEditName(c.name); setEditCrew(c.crew || CREWS[0]); setEditRarity(c.rarity || RARITIES[0]); setEditImageUrl(c.imageUrl || ''); setEditIsWaifu(!!c.isWaifu); setEditGender(c.gender || 'Male'); }} className="px-3.5 py-1.5 bg-brand/20 text-brand text-[9px] font-black rounded uppercase hover:bg-brand/35 transition-colors">Config</button>
                    <button onClick={() => handleToggleFreeze(c.id)} className={`px-3.5 py-1.5 rounded text-[9px] font-black uppercase transition-colors ${settings.frozenCharacters.includes(c.id) ? 'bg-warn text-black hover:bg-warn/80' : 'bg-white/10 text-muted hover:bg-white/20'}`}>Freeze</button>
                    <button onClick={() => handleDeleteChar(c.id)} className="text-bad px-3.5 py-1.5 hover:text-white border border-bad/20 hover:border-bad/50 bg-bad/5 hover:bg-bad/20 rounded text-[9px] font-black uppercase transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="glass-panel p-6 rounded-md space-y-4 animate-fade-in-up border border-line relative overflow-hidden group">
           <div className="laser-sweep" />
           <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em] mb-4">[ USER_AUTHORITY_VAULT ]</h3>
           <div className="flex gap-2.5">
             <Input placeholder="Search Email or UID..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="font-mono text-xs" />
             <Button onClick={handleSearchUsers} variant="secondary" className="font-heading font-black text-[10px] tracking-widest px-8">QUERY</Button>
           </div>
           {!selectedUser && (
             <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                {userList.map(u => (
                  <div key={u.id} onClick={() => setSelectedUser(u)} className="p-4 bg-black/45 border border-line flex justify-between items-center cursor-pointer hover:bg-black/60 transition-colors">
                     <div>
                         <div className="font-bold text-white uppercase tracking-wider">{u.email || "No Identifier"}</div>
                         <div className="text-[10px] text-muted font-mono">{u.username} • UID: {u.id.substring(0,12)}...</div>
                     </div>
                     <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border ${
                       u.isBanned 
                         ? 'bg-bad/10 text-bad border-bad/20 shadow-[0_0_8px_rgba(225,29,72,0.1)]' 
                         : 'bg-good/10 text-good border-good/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                     }`}>
                        {u.isBanned ? 'BANNED' : 'ACTIVE'}
                     </span>
                  </div>
                ))}
             </div>
           )}
           {selectedUser && (
             <div className="p-6 bg-black/60 border border-line rounded-md relative overflow-hidden">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                         <h4 className="text-2xl font-heading text-white italic leading-none">{selectedUser.username || "Unknown Agent"}</h4>
                         <div className="text-[10px] text-muted font-mono mt-1">{selectedUser.email}</div>
                     </div>
                     <Button variant="ghost" onClick={() => setSelectedUser(null)} className="h-8 w-8 !p-0 font-bold border border-line rounded">✕</Button>
                 </div>
                 <div className="space-y-6">
                    <div className="flex gap-4 items-end bg-black/45 p-5 border border-line rounded-sm">
                       <Input label="Adjust Liquidity Balance (Φ)" type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="+/- amount" className="font-mono text-xs" />
                       <Button onClick={() => handleUpdateCash(parseInt(cashAmount))} className="font-heading font-black text-[10px] tracking-widest px-8 !py-3">EXECUTE</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={handleBanToggle} variant={selectedUser.isBanned ? 'success' : 'danger'}>{selectedUser.isBanned ? 'RESTORE SESSION KEY' : 'TERMINATE SESSION ACCESS'}</Button>
                        {isMainAdmin && (
                          <div className="flex gap-2">
                              <Button onClick={() => handleSetRole('worker')} variant="secondary" className="flex-1 text-[9px] font-heading font-black tracking-widest">PROMOTE WORKER</Button>
                              <Button onClick={() => handleSetRole(null)} variant="secondary" className="flex-1 text-[9px] font-heading font-black tracking-widest">REVOKE LEVEL</Button>
                          </div>
                        )}
                    </div>
                 </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'NEWS' && (
        <div className="glass-panel p-6 rounded-md space-y-4 animate-fade-in-up border border-line relative overflow-hidden group">
           <div className="laser-sweep" />
           <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em] mb-4">[ BROADCAST_INTEL_SYSTEM ]</h3>
           <div className="space-y-4">
               <Input label="Signal Headline" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="font-mono text-xs" />
               <div>
                  <label className="text-[9px] font-heading font-black text-muted tracking-widest uppercase block mb-1">Briefing Content</label>
                  <textarea className="w-full p-4 bg-black/60 border border-line rounded text-white font-mono text-xs min-h-[140px] focus:outline-none focus:border-brand transition-colors" value={newsBody} onChange={e => setNewsBody(e.target.value)} placeholder="Enter details..." />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <Select label="Classification" value={newsType} onChange={e => setNewsType(e.target.value as any)} className="font-mono text-xs">
                        <option value="system">System News</option>
                        <option value="market">Market Update</option>
                        <option value="character">Character Update</option>
                        <option value="event">Event Protocol</option>
                   </Select>
                   <Select label="Subject Node Link" value={newsCharId} onChange={e => setNewsCharId(e.target.value)} className="font-mono text-xs">
                        <option value="">None</option>
                        {market.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </Select>
               </div>
               <Button onClick={handlePostNews} className="w-full font-heading font-black text-[10px] tracking-widest !py-3 shadow-lg">BROADCAST SIGNAL</Button>
           </div>
        </div>
      )}

      {activeTab === 'EVENTS' && (
        <div className="glass-panel p-6 rounded-md space-y-4 animate-fade-in-up border border-line relative overflow-hidden group">
           <div className="laser-sweep" />
           <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.2em] mb-4">[ LIVE_PROTOCOL_TRIGGER ]</h3>
           <div className="bg-black/45 border border-line p-6 rounded-sm space-y-6">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <span className="text-[10px] font-heading font-black text-muted uppercase tracking-widest">Protocol status</span>
                {settings.event?.active ? (
                   <span className="bg-good/15 text-good border border-good/25 px-2.5 py-1 text-[9px] font-mono font-black rounded-sm tracking-widest shadow-[0_0_8px_rgba(16,185,129,0.1)]">ACTIVE: {settings.event.name.toUpperCase()}</span>
                ) : (
                   <span className="bg-white/5 text-muted/60 border border-line px-2.5 py-1 text-[9px] font-mono font-black rounded-sm tracking-widest">OFFLINE</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Protocol Designation" value={eventName} onChange={e => setEventName(e.target.value)} className="font-mono text-xs" />
                <Input label="Value Multiplier Coefficient" type="number" step="0.1" value={eventMult} onChange={e => setEventMult(e.target.value)} className="font-mono text-xs" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                 <Button onClick={handleSaveEvent} className="flex-1 font-heading font-black text-[10px] tracking-widest !py-3">INITIATE DECK PROTOCOL</Button>
                 <Button onClick={stopEvent} variant="secondary" className="flex-1 font-heading font-black text-[10px] tracking-widest !py-3">ABORT DECK PROTOCOL</Button>
              </div>
           </div>
        </div>
      )}


    </div>
  );
};