import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { auth, db, formatMoney, formatTime } from '../services/firebase';
import * as Auth from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp, 
  runTransaction,
  limit
} from 'firebase/firestore';
import { Layout } from '../components/features/Layout';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { MarketCard } from '../components/features/MarketCard';
import { TradeModal } from '../components/features/TradeModal';
import { AdminPanel } from '../components/features/AdminPanel';
import { NewsCard } from '../components/features/NewsCard';
import { Character, GameSettings, UserProfile, Trade, UserPrivateData, Announcement, DailyMissionProgress } from '../types';
import { ADMIN_EMAIL, STARTING_CASH, CREWS } from '../constants';
import { Market } from '../components/features/Market';
import { WaifuPanel } from '../components/features/WaifuPanel';
import { StrongestRank } from '../components/features/StrongestRank';
import { OnboardingPortal } from '../components/features/OnboardingPortal';
import { SplashScreen } from '../components/features/SplashScreen';
import { CharacterModal } from '../components/features/CharacterModal';
import { ToastProvider, useToast } from '../components/features/Toast';
import { Tutorial } from '../components/features/Tutorial';
import { AchievementBadge } from '../components/features/AchievementBadge';
import { DailyMissions } from '../components/features/DailyMissions';
import { useSound } from '../hooks/useSound';
import { ACHIEVEMENTS, checkNewAchievements } from '../utils/achievements';
import { DAILY_MISSIONS, getTodayStr, checkMissionProgress } from '../utils/missions';
import { priceEngine } from '../utils/priceEngine';
import { checkLoginStreak, MYSTERY_BOXES } from '../utils/gamification';
import { MobileNav } from '../components/features/MobileNav';
import { MysteryBoxShop } from '../components/features/MysteryBoxShop';
import { AdminTools } from '../components/features/AdminTools';
import { usePullToRefresh, haptic } from '../hooks/usePullToRefresh';
import { createConfetti } from '../utils/confetti';
import { useKeyboard } from '../hooks/useKeyboard';
import { SettingsPanel } from '../components/features/SettingsPanel';
import { PortfolioChart } from '../components/features/PortfolioChart';
import { usePriceFlash } from '../hooks/usePriceFlash';
import { addRecentSearch, getRecentSearches, clearRecentSearches } from '../utils/recentSearches';

const SkeletonLoader = () => (
  <div className="min-h-screen bg-bg0 p-8 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="text-4xl font-heading text-white animate-pulse">LOADING SYSTEM...</div>
      <div className="w-64 h-2 bg-line rounded overflow-hidden relative">
        <div className="absolute inset-0 bg-brand animate-scanline w-full origin-left" />
      </div>
      <div className="font-mono text-xs text-muted uppercase tracking-[0.3em] opacity-60">Establishing Secure Connection</div>
    </div>
  </div>
);

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [view, setView] = useState('dashboard');
  const [isBanned, setIsBanned] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showMysteryBox, setShowMysteryBox] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakBonus, setStreakBonus] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('stockism_sound') !== 'false');
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('stockism_animations') !== 'false');
  const [netWorthHistory, setNetWorthHistory] = useState<{ time: number; netWorth: number }[]>([]);
  const [recentSearches, setRecentSearchesState] = useState<string[]>(getRecentSearches());
  
  const [cash, setCash] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [username, setUsername] = useState('');
  const [market, setMarket] = useState<Character[]>([]);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  
  const [tradeChar, setTradeChar] = useState<Character | null>(null);
  const [charModal, setCharModal] = useState<Character | null>(null);
  const [lastTradeAt, setLastTradeAt] = useState(0);
  const [search, setSearch] = useState("");
  
  const [editUsername, setEditUsername] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [popTab, setPopTab] = useState<'Male' | 'Female'>('Male');
  
  // Achievements
  const [badges, setBadges] = useState<string[]>([]);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  
  // Daily Missions
  const [missions, setMissions] = useState<DailyMissionProgress[]>([]);
  
  // Price History (in-memory)
  const [priceHistory, setPriceHistory] = useState<Record<string, { time: number; price: number }[]>>({});

  const { addToast } = useToast();
  const sounds = useSound();

  const [settings, setSettings] = useState<GameSettings>({
    tradingEnabled: true,
    marketMessage: "",
    season: 1,
    cashCap: 0,
    cooldownSeconds: 0,
    maxSharesPerUser: 0,
    frozenCharacters: [],
    popularityVotingEnabled: false,
    strongestVotingEnabled: false,
    bannerImageUrl: ""
  });

  // Track price history for char modal
  useEffect(() => {
    if (market.length === 0) return;
    const now = Date.now();
    const updates: Record<string, { time: number; price: number }[]> = {};
    market.forEach(char => {
      const existing = priceHistory[char.id] || [];
      const last = existing[existing.length - 1];
      if (!last || now - last.time > 600000) { // Every 10 min
        updates[char.id] = [...existing.slice(-47), { time: now, price: char.price }];
      }
    });
    if (Object.keys(updates).length > 0) {
      setPriceHistory(prev => ({ ...prev, ...updates }));
    }
  }, [market]);

  // Load badges and missions from user data
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users_public', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setBadges(data.badges || []);
        setMissions(data.missions || DAILY_MISSIONS.map(m => ({
          missionId: m.id, progress: 0, completed: false, claimed: false, date: getTodayStr()
        })));
      }
    });
    return unsub;
  }, [user]);

  // Achievement sound
  useEffect(() => {
    if (newAchievements.length > 0) {
      sounds.achievement();
      if (animationsEnabled) createConfetti(40);
      newAchievements.forEach(ach => {
        addToast({ message: `🏆 Achievement Unlocked: ${ach.name}`, type: 'achievement', duration: 5000 });
      });
      // Save badges
      if (user) {
        const allBadges = [...badges, ...newAchievements.map((a: any) => a.id)];
        setBadges(allBadges);
        updateDoc(doc(db, 'users_public', user.uid), { badges: allBadges }).catch(() => {});
        setNewAchievements([]);
      }
    }
  }, [newAchievements]);

  // Check achievements after trade/metrics change
  const checkAchievements = useCallback(() => {
    if (!user || !username) return;
    const totalVal = netWorth;
    const heldChars = Object.keys(holdings).filter(k => (holdings[k] || 0) > 0).length;
    const rank = leaderboard.findIndex(u => u.username === username) + 1 || null;
    const biggestTrade = Math.max(...trades.filter(t => t.uid === user.uid).map(t => t.total), 0);
    
    const stats = {
      tradesCount: trades.filter(t => t.uid === user.uid).length,
      netWorth: totalVal,
      biggestTrade,
      holdingsCount: Object.values(holdings).reduce((a: number, b: number) => a + b, 0),
      charactersHeld: heldChars,
      leaderboardRank: rank,
    };
    
    const newOnes = checkNewAchievements(badges, stats);
    if (newOnes.length > 0) setNewAchievements(prev => [...prev, ...newOnes]);
  }, [user, username, netWorth, holdings, trades, leaderboard, badges]);

  useEffect(() => { checkAchievements(); }, [netWorth, trades.length]);

  // Track net worth history for portfolio chart
  useEffect(() => {
    if (!user) return;
    setNetWorthHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && Date.now() - last.time < 60000) {
        // Update last entry if within 1 minute
        const updated = [...prev];
        updated[updated.length - 1] = { time: Date.now(), netWorth };
        return updated;
      }
      const next = [...prev, { time: Date.now(), netWorth }];
      return next.slice(-100); // Keep last 100 points
    });
  }, [netWorth, user]);

  // Keyboard shortcuts
  useKeyboard([
    { key: '1', action: () => setView('dashboard') },
    { key: '2', action: () => setView('market') },
    { key: '3', action: () => setView('waifu') },
    { key: '4', action: () => user && setView('portfolio') },
    { key: '5', action: () => setView('leaderboard') },
    { key: '6', action: () => setView('trades') },
    { key: 'Escape', action: () => { setCharModal(null); setTradeChar(null); setShowSettings(false); } },
    { key: 'm', action: () => {
      const current = localStorage.getItem('stockism-theme') || 'dark';
      const next = current === 'dark' ? 'neon' : 'dark';
      localStorage.setItem('stockism-theme', next);
      window.location.reload();
    }},
  ]);

  useEffect(() => {
    const timer = setTimeout(() => { if (loading) setLoadingError(true); }, 12000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const failsafe = setTimeout(() => { if (loading) setLoading(false); }, 15000);
    const unsub = Auth.onAuthStateChanged(auth, async (u) => {
      try {
        setUser(u);
        if (u) {
          const userRef = doc(db, 'users', u.uid);
          const pubRef = doc(db, 'users_public', u.uid);
          const privSnap = await getDoc(userRef);
          if (!privSnap.exists()) {
            await setDoc(userRef, { cash: 5000, createdAt: serverTimestamp(), email: u.email, bonusClaimed: true }, { merge: true });
            setShowWelcome(true);
          } else {
            const pData = privSnap.data() as UserPrivateData;
            if (pData.isBanned) setIsBanned(true);
            setUserRole(pData.role || null);
            // Login streak
            try {
              const result = await checkLoginStreak(u.uid);
              if (result.isNew && result.bonus > 0) {
                setStreak(result.streak);
                setStreakBonus(result.bonus);
                setShowStreak(true);
                sounds.success();
                addToast({ message: `🔥 Day ${result.streak} streak! +Φ ${result.bonus.toLocaleString()} bonus`, type: 'success' });
              }
            } catch {}
          }
          const pubSnap = await getDoc(pubRef);
          if (!pubSnap.exists()) {
            const defaultName = (u.email || "user").split("@")[0].slice(0, 12);
            await setDoc(pubRef, { username: defaultName, netWorth: 5000, liquidPhi: 5000, badges: [], missions: [], updatedAt: serverTimestamp() }, { merge: true });
          } else {
            const pubData = pubSnap.data();
            // Check tutorial
            if (!pubData.tutorialComplete) setShowTutorial(true);
            // Init missions if needed
            if (!pubData.missions || pubData.missions.length === 0) {
              const initMissions = DAILY_MISSIONS.map(m => ({ missionId: m.id, progress: 0, completed: false, claimed: false, date: getTodayStr() }));
              setDoc(pubRef, { missions: initMissions }, { merge: true }).catch(() => {});
            }
          }
        }
      } catch (e) { console.warn("User sync error", e);
      } finally { setLoading(false); clearTimeout(failsafe); }
    });
    return () => { unsub(); clearTimeout(failsafe); };
  }, []);

  useEffect(() => {
    const unsubGame = onSnapshot(doc(db, 'game', 'settings'), (snap) => {
      if (snap.exists()) {
        const s = snap.data();
        setSettings({
          tradingEnabled: s.tradingEnabled ?? true,
          marketMessage: s.marketMessage || "",
          season: s.season || 1,
          cashCap: s.cashCap || 0,
          cooldownSeconds: s.cooldownSeconds || 0,
          maxSharesPerUser: s.maxSharesPerUser || 0,
          frozenCharacters: Array.isArray(s.frozenCharacters) ? s.frozenCharacters : [],
          event: s.event || undefined,
          popularityVotingEnabled: s.popularityVotingEnabled ?? false,
          strongestVotingEnabled: s.strongestVotingEnabled ?? false,
          bannerImageUrl: s.bannerImageUrl || ""
        });
      }
    }, (err) => console.error("Settings stream error:", err));
    const unsubMarket = onSnapshot(query(collection(db, 'characters'), orderBy('name')), (snap) => {
      const chars: Character[] = [];
      snap.forEach(d => { const data = d.data(); chars.push({ id: d.id, ...data } as Character); });
      setMarket(chars);
      // Init price engine
      priceEngine.init(chars.map(c => ({ id: c.id, price: c.price, volatility: c.volatility })));
      priceEngine.start();
    }, (err) => console.error("Market stream error:", err));

    // Price engine subscription — update prices in real-time
    const unsubPrice = priceEngine.subscribe((ticks) => {
      setMarket(prev => prev.map(c => {
        const tick = ticks.find(t => t.charId === c.id);
        if (tick) {
          // Update Firestore periodically (throttled)
          const updatedPrice = tick.newPrice;
          return { ...c, price: updatedPrice, lastUpdated: Date.now() };
        }
        return c;
      }));
      // Alert on big moves
      ticks.forEach(t => {
        if (Math.abs(t.changePct) > 8) {
          addToast({ message: `⚡ ${t.charId.slice(0, 6)}... ${t.changePct > 0 ? '📈' : '📉'} ${Math.abs(t.changePct).toFixed(1)}%`, type: 'info' });
        }
      });
    });
    const unsubTrades = onSnapshot(query(collection(db, 'trades'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
      const t: Trade[] = [];
      snap.forEach(d => t.push(d.data() as Trade));
      setTrades(t);
    }, (err) => console.error("Trades stream error:", err));
    const unsubLb = onSnapshot(query(collection(db, 'users_public'), orderBy('netWorth', 'desc'), limit(25)), (snap) => {
      const l: UserProfile[] = [];
      snap.forEach(d => l.push(d.data() as UserProfile));
      setLeaderboard(l);
    }, (err) => console.error("Leaderboard stream error:", err));
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
      const n: Announcement[] = [];
      snap.forEach(d => n.push({ id: d.id, ...d.data() } as Announcement));
      setNews(n);
    }, (err) => console.error("News stream error:", err));
    return () => { unsubGame(); unsubMarket(); unsubTrades(); unsubLb(); unsubNews(); unsubPrice(); priceEngine.stop(); };
  }, []);

  // News price impact — apply active impacts to character prices
  useEffect(() => {
    const activeImpacts = news.filter(n => n.priceImpact && n.expiresAt && n.impactedCharId);
    if (activeImpacts.length === 0) return;
    setMarket(prev => prev.map(c => {
      const impact = activeImpacts.find(n => n.impactedCharId === c.id);
      if (impact) {
        const multiplier = 1 + (impact.priceImpact || 0) / 100;
        return { ...c, price: Math.round((c.price || 0) * multiplier) };
      }
      return c;
    }));
  }, [news]);

  useEffect(() => {
    if (!user) return;
    const unsubWallet = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCash(Number(data.cash) || 0);
        setIsBanned(!!data.isBanned);
        setUserRole(data.role || null);
      }
    }, (err) => console.error("Wallet stream error:", err));
    const unsubHoldings = onSnapshot(collection(db, 'holdings', user.uid, 'items'), (snap) => {
      const h: Record<string, number> = {};
      snap.forEach(d => { const val = Number(d.data().shares); if (val > 0) h[d.id] = val; });
      setHoldings(h);
    }, (err) => console.error("Holdings stream error:", err));
    const unsubProfile = onSnapshot(doc(db, 'users_public', user.uid), (snap) => {
      if (snap.exists()) {
        const name = snap.data().username || "";
        setUsername(name);
        setEditUsername(name);
      }
    }, (err) => console.error("Profile stream error:", err));
    return () => { unsubWallet(); unsubHoldings(); unsubProfile(); };
  }, [user]);

  useEffect(() => {
    if (!user || market.length === 0) return;
    let portfolioValue = 0;
    const multiplier = (settings.event?.active && settings.event.priceMultiplier) ? Number(settings.event.priceMultiplier) : 1;
    Object.entries(holdings).forEach(([id, shares]) => {
      const char = market.find(c => c.id === id);
      if (char) portfolioValue += (Number(char.price) * multiplier) * (Number(shares) || 0);
    });
    const total = (Number(cash) || 0) + portfolioValue;
    setNetWorth(total);
    const timeout = setTimeout(() => {
      if (total > 0 || cash > 0) {
        updateDoc(doc(db, 'users_public', user.uid), { netWorth: total, liquidPhi: Number(cash) || 0, updatedAt: serverTimestamp() }).catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [cash, holdings, market, user, settings.event]);

  // Track daily missions: visit
  useEffect(() => {
    if (!user || missions.length === 0) return;
    const updated = checkMissionProgress(missions, 'visit');
    if (JSON.stringify(updated) !== JSON.stringify(missions)) {
      setMissions(updated);
      updateDoc(doc(db, 'users_public', user.uid), { missions: updated }).catch(() => {});
    }
  }, [view]);

  const handleLogout = async () => {
    sounds.click();
    await Auth.signOut(auth);
    setUser(null);
    setShowAuthModal(false);
    setView('dashboard');
  };

  const handleUpdateUsername = async () => {
    if (!user) return;
    if (editUsername.trim().length < 3) {
      setProfileMessage({ text: "Callsign too short", type: "error" });
      return;
    }
    setIsUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'users_public', user.uid), { username: editUsername.trim(), updatedAt: serverTimestamp() });
      setProfileMessage({ text: "Credentials updated", type: "success" });
      sounds.success();
    } catch (e: any) {
      setProfileMessage({ text: "Update failed", type: "error" });
      sounds.error();
    } finally { setIsUpdatingProfile(false); }
  };

  const handleTrade = async (charId: string, side: 'BUY' | 'SELL', qty: number) => {
    if (!user || !username) return;
    const now = Date.now();
    if (now - lastTradeAt < (settings.cooldownSeconds * 1000)) throw new Error("Order cooldown active");
    await runTransaction(db, async (txn) => {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await txn.get(userRef);
      const charRef = doc(db, 'characters', charId);
      const charDoc = await txn.get(charRef);
      const holdingRef = doc(db, 'holdings', user.uid, 'items', charId);
      const holdingDoc = await txn.get(holdingRef);
      if (!charDoc.exists()) throw new Error("Asset not found");
      const charData = charDoc.data() as Character;
      const multiplier = (settings.event?.active && settings.event.priceMultiplier) ? settings.event.priceMultiplier : 1;
      const finalPrice = Math.floor((charData.price || 0) * multiplier);
      const totalCost = finalPrice * qty;
      const currentCash = userDoc.data()?.cash || 0;
      const currentShares = holdingDoc.exists() ? holdingDoc.data().shares : 0;
      if (side === 'BUY') {
        if (currentCash < totalCost) throw new Error("Insufficient Phi liquidity");
        txn.update(userRef, { cash: currentCash - totalCost });
        txn.set(holdingRef, { shares: currentShares + qty }, { merge: true });
      } else {
        if (currentShares < qty) throw new Error("Insufficient asset holdings");
        txn.update(userRef, { cash: currentCash + totalCost });
        txn.set(holdingRef, { shares: currentShares - qty }, { merge: true });
      }
      const tradeRef = doc(collection(db, 'trades'));
      const isWhale = totalCost >= 100000;
      txn.set(tradeRef, {
        uid: user.uid, username, charId, character: charData.name, crew: charData.crew,
        side, qty, price: finalPrice, total: totalCost, isWhale: isWhale || false, createdAt: serverTimestamp()
      });
    });
    setLastTradeAt(Date.now());
    sounds.trade();
    
    // Track mission progress
    if (user) {
      const updated = checkMissionProgress(missions, 'trade');
      setMissions(updated);
      updateDoc(doc(db, 'users_public', user.uid), { missions: updated }).catch(() => {});
    }
    
    if (animationsEnabled) createConfetti(side === 'BUY' ? 20 : 10);
    
    const char = market.find(c => c.id === charId);
    addToast({ message: `${side === 'BUY' ? '✅ Bought' : '❌ Sold'} ${qty}x ${char?.name || charId} for Φ ${formatMoney((char?.price || 0) * qty)}`, type: side === 'BUY' ? 'success' : 'info' });
  };

  const handleVote = async (charId: string, charGender: 'Male'|'Female') => {
    if (!user) { setShowAuthModal(true); return; }
    if (!settings.popularityVotingEnabled) return;
    const today = new Date().toISOString().split('T')[0];
    const voteId = `v_${today}_${user.uid}_${charGender}`;
    const voteRef = doc(db, 'daily_votes', voteId);
    const charRef = doc(db, 'characters', charId);
    try {
      await runTransaction(db, async (txn) => {
        const voteDoc = await txn.get(voteRef);
        if (voteDoc.exists()) throw new Error("Daily voting quota reached");
        const cDoc = await txn.get(charRef);
        txn.update(charRef, { popularityVotes: (cDoc.data()?.popularityVotes || 0) + 1 });
        txn.set(voteRef, { uid: user.uid, charId, gender: charGender, timestamp: serverTimestamp() });
      });
      sounds.success();
      addToast({ message: "Vote registered successfully", type: 'success' });
      // Track mission
      const updated = checkMissionProgress(missions, 'vote');
      setMissions(updated);
      updateDoc(doc(db, 'users_public', user.uid), { missions: updated }).catch(() => {});
    } catch (e: any) { sounds.error(); addToast({ message: e.message, type: 'error' }); }
  };

  const handleStrongestVote = async (charId: string) => {
    if (!user) { setShowAuthModal(true); return; }
    if (!settings.strongestVotingEnabled) return;
    const today = new Date().toISOString().split('T')[0];
    const voteId = `sv_${today}_${user.uid}`;
    const voteRef = doc(db, 'daily_votes', voteId);
    const charRef = doc(db, 'characters', charId);
    try {
      await runTransaction(db, async (txn) => {
        const voteDoc = await txn.get(voteRef);
        if (voteDoc.exists()) throw new Error("Already cast power vote today.");
        const cDoc = await txn.get(charRef);
        txn.update(charRef, { strengthVotes: (cDoc.data()?.strengthVotes || 0) + 1 });
        txn.set(voteRef, { uid: user.uid, charId, type: 'strength', timestamp: serverTimestamp() });
      });
      sounds.success();
      addToast({ message: "Power vote registered.", type: 'success' });
    } catch (e: any) { sounds.error(); addToast({ message: e.message, type: 'error' }); }
  };

  const handleClaimMission = async (missionId: string) => {
    if (!user) return;
    const updated = missions.map(m => {
      if (m.missionId === missionId && m.completed && !m.claimed) {
        // Add reward
        const def = DAILY_MISSIONS.find(d => d.id === missionId);
        if (def) {
          const userRef = doc(db, 'users', user.uid);
          getDoc(userRef).then(snap => {
            if (snap.exists()) {
              const currentCash = snap.data().cash || 0;
              updateDoc(userRef, { cash: currentCash + def.reward }).catch(() => {});
            }
          });
        }
        sounds.success();
        addToast({ message: `💰 Claimed Φ ${def?.reward.toLocaleString()} mission reward!`, type: 'success' });
        return { ...m, claimed: true };
      }
      return m;
    });
    setMissions(updated);
    updateDoc(doc(db, 'users_public', user.uid), { missions: updated }).catch(() => {});
  };

  const handleCardClick = (char: Character) => {
    sounds.click();
    setCharModal(char);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('stockism_sound', String(next));
  };

  const handleToggleAnimations = () => {
    const next = !animationsEnabled;
    setAnimationsEnabled(next);
    localStorage.setItem('stockism_animations', String(next));
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    if (val.trim()) {
      const updated = addRecentSearch(val);
      setRecentSearchesState(updated);
    }
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  if (loadingError) return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center p-4">
      <div className="glass-panel p-10 text-center max-w-sm w-full border-bad/50 shadow-2xl">
        <div className="w-16 h-16 bg-bad/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-bad">⚠️</span>
        </div>
        <h2 className="text-2xl font-heading mb-2 text-white uppercase tracking-widest">Initialization Failed</h2>
        <p className="text-xs font-mono text-muted mb-8 uppercase leading-relaxed">System failed to establish handshake with secure nodes.</p>
        <Button onClick={() => window.location.reload()} variant="danger" className="w-full">REBOOT TERMINAL</Button>
      </div>
    </div>
  );

  if (loading) return <SkeletonLoader />;

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || userRole === 'worker';
  const frozenIds = settings.frozenCharacters || [];

  return (
    <>
      {/* Tutorial overlay */}
      {showTutorial && (
        <Tutorial
          step={tutorialStep}
          onNext={() => setTutorialStep(s => Math.min(s + 1, 4))}
          onSkip={() => { setShowTutorial(false); if (user) updateDoc(doc(db, 'users_public', user.uid), { tutorialComplete: true }).catch(() => {}); }}
          onFinish={() => { setShowTutorial(false); if (user) updateDoc(doc(db, 'users_public', user.uid), { tutorialComplete: true }).catch(() => {}); }}
        />
      )}

      {/* Character Modal */}
      {charModal && (
        <CharacterModal
          char={charModal}
          onClose={() => setCharModal(null)}
          onTrade={setTradeChar}
          holdings={holdings[charModal.id] || 0}
          priceHistory={priceHistory[charModal.id]}
        />
      )}

      <Layout 
        activeView={view} 
        setView={setView} 
        userEmail={user?.email || null} 
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onLoginRequest={() => setShowAuthModal(true)}
        onSettingsRequest={() => setShowSettings(true)}
        cash={cash}
        netWorth={netWorth}
        isTradingEnabled={settings.tradingEnabled}
        bannerImageUrl={settings.bannerImageUrl}
      >
        {view === 'dashboard' && (() => {
          const totalVal = netWorth || 1;
          const cashPct = Math.min(100, Math.max(0, Math.floor((cash / totalVal) * 100)));
          const assetPct = 100 - cashPct;
          return (
            <div className="space-y-6 flex flex-col min-h-full">
              {/* Diagnostics Widgets */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
                <div className="glass-panel p-4 rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest block mb-1">COGNITIVE_GRID</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse shadow-[0_0_6px_var(--color-brand)]" />
                    <span className="text-[10px] font-mono font-black text-white">SYS://ONLINE</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest block mb-1">MARKET_CONDITION</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-good shadow-[0_0_6px_var(--color-good)]" />
                    <span className="text-[10px] font-mono font-black text-good">TICK_HIGH_VOL</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest block mb-1">DB_LATENCY</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]" />
                    <span className="text-[10px] font-mono font-black text-white">PING://28MS</span>
                  </div>
                </div>
                <div className="glass-panel p-4 rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest block mb-1">SEASON_STATUS</span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#FFE600] rounded-full animate-ping shadow-[0_0_6px_#FFE600]" />
                    <span className="text-[10px] font-mono font-black text-white">SEASON_01_ACTIVE</span>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
                  <div className="glass-panel p-12 text-center rounded-md relative overflow-hidden group">
                    <div className="laser-sweep" />
                    <h1 className="text-6xl font-heading text-white mb-4 italic tracking-tighter cyber-glitch-hover select-none">
                      STOCK<span className="text-brand">ISM</span>
                    </h1>
                    <p className="text-muted font-heading font-black max-w-2xl mx-auto mb-2 uppercase tracking-[0.25em] text-[10px] opacity-80">
                      Secure elite assets. Dominate the exchange. Establish supremacy.
                    </p>
                  </div>
                  <div onClick={() => setShowAuthModal(true)} className="glass-panel p-8 rounded-md relative overflow-hidden group cursor-pointer border border-brand/35 hover:border-brand transition-all shadow-[0_0_15px_rgba(225,29,72,0.15)] hover:shadow-[0_0_30px_rgba(225,29,72,0.35)] duration-300 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="laser-sweep" />
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-brand/10 border border-brand/35 text-brand rounded-full flex items-center justify-center text-3xl font-mono shadow-[0_0_12px_rgba(225,29,72,0.25)] animate-pulse shrink-0">Φ</div>
                      <div className="text-left">
                        <span className="text-[8px] font-heading font-black text-brand tracking-[0.2em] uppercase">Bounty initiative // Active</span>
                        <h3 className="text-xl font-heading font-black italic tracking-tight text-white uppercase mt-1">Claim Φ 5,000 Signup Bounty</h3>
                        <p className="text-xs text-muted mt-1 uppercase font-mono tracking-wider font-light">Establish your connection node today to claim your starting speculation liquidity.</p>
                      </div>
                    </div>
                    <Button onClick={(e) => { e.stopPropagation(); setShowAuthModal(true); }} className="shadow-[0_0_15px_rgba(225,29,72,0.25)] border border-brand font-heading font-black text-[10px] tracking-widest bg-brand text-white w-full md:w-auto !py-3 px-8 shrink-0 hover:shadow-[0_0_25px_var(--color-brand)]">SECURE BOUNTY NOW</Button>
                  </div>
                </div>
              )}

              {settings.event?.active && (
                <div className="relative overflow-hidden h-40 md:h-56 rounded-md animate-fade-in-up group bg-black border border-brand/35 shadow-[0_0_20px_rgba(225,29,72,0.15)]">
                  <div className="laser-sweep" />
                  <div className="absolute inset-0 bg-brand/20 opacity-50 z-0" />
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0)_49.9%,var(--color-brand)_50%,rgba(0,0,0,0)_50.1%)] opacity-10 bg-[length:10px_10px] pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 z-10" />
                  <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
                    <h2 className="text-5xl md:text-7xl font-heading text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(225,29,72,0.8)] scale-100 group-hover:scale-105 transition-transform duration-500 uppercase">
                      {settings.event.name}
                    </h2>
                    <p className="text-xs font-heading font-black text-brand uppercase tracking-[0.3em] bg-black/75 px-4 py-1.5 backdrop-blur-md border border-brand/20 mt-2">Market Multiplier Active</p>
                  </div>
                </div>
              )}

              {/* Live Ticker */}
              <div className="glass-panel overflow-hidden rounded-md border border-line group relative">
                <div className="laser-sweep" />
                <div className="flex items-center h-10 bg-black/40">
                  <div className="flex items-center gap-2 px-5 h-full border-r border-line bg-brand/10 shrink-0">
                    <div className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand)]" />
                    <span className="text-[9px] font-heading font-black text-brand uppercase tracking-widest">LIVE</span>
                  </div>
                  <div className="ticker-wrap flex-1 h-full flex items-center">
                    <div className="ticker-content flex items-center gap-16 px-5">
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ MARKET CAP: <span className="text-white font-bold">$12.4M</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ 24H VOL: <span className="text-good font-bold">$847K ▲ 12.4%</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ ACTIVE NODES: <span className="text-white font-bold">{market.length}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ TRANSACTIONS: <span className="text-white font-bold">{trades.length}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ SEASON: <span className="text-brand font-bold">{settings.season}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ TRADING: <span className={settings.tradingEnabled ? 'text-good font-bold' : 'text-bad font-bold'}>{settings.tradingEnabled ? 'OPEN' : 'CLOSED'}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ MARKET CAP: <span className="text-white font-bold">$12.4M</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ 24H VOL: <span className="text-good font-bold">$847K ▲ 12.4%</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ ACTIVE NODES: <span className="text-white font-bold">{market.length}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ TRANSACTIONS: <span className="text-white font-bold">{trades.length}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ SEASON: <span className="text-brand font-bold">{settings.season}</span></span>
                      <span className="text-[10px] font-mono text-muted/60 whitespace-nowrap">Φ TRADING: <span className={settings.tradingEnabled ? 'text-good font-bold' : 'text-bad font-bold'}>{settings.tradingEnabled ? 'OPEN' : 'CLOSED'}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up anim-delay-2 mb-8">
                <div className="glass-panel h-[400px] flex flex-col rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <div className="p-3.5 border-b border-line bg-white/[0.015] uppercase font-heading font-black tracking-widest text-[9px] text-white/50">[ EXCH_LOG_DIAGNOSTIC ]</div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-[11px] custom-scrollbar">
                    {trades.slice(0, 20).map((t, i) => (
                      <div key={i} className="flex gap-2 text-muted/80">
                        <span className="text-white/20">[{formatTime(t.createdAt)}]</span>
                        <span className="text-brand font-black uppercase">{t.username}</span>
                        <span className={t.side === 'BUY' ? 'text-good font-bold' : 'text-bad font-bold'}>{t.side}</span>
                        <span className="text-white font-medium uppercase">{t.character}</span>
                      </div>
                    ))}
                    {trades.length === 0 && <div className="text-muted text-center py-20 italic">No activity recorded...</div>}
                  </div>
                </div>
                <div className="glass-panel p-8 flex flex-col justify-center bg-gradient-to-br from-white/[0.005] to-transparent rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <h3 className="text-muted font-heading font-black text-[9px] tracking-[0.2em] mb-2.5 uppercase">[ COMBINED_VALUATION ]</h3>
                  <div className="text-5xl font-mono text-white font-black tracking-tighter flex items-center gap-2">
                    <span className="text-brand">Φ</span>
                    {formatMoney(netWorth)}
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-[8px] font-heading font-bold text-muted/60 tracking-wider uppercase">
                      <span>Liquid ratio: {cashPct}%</span>
                      <span>Asset ratio: {assetPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 border border-line rounded overflow-hidden flex">
                      <div className="h-full bg-good transition-all duration-500 shadow-[0_0_8px_var(--color-good)]" style={{ width: `${cashPct}%` }} />
                      <div className="h-full bg-[#00F0FF] transition-all duration-500 shadow-[0_0_8px_#00F0FF]" style={{ width: `${assetPct}%` }} />
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <div className="flex-1 p-3.5 bg-black/35 border border-line rounded-sm relative overflow-hidden">
                      <div className="text-[8px] font-heading font-black text-muted uppercase tracking-[0.15em] mb-1.5">Liquid Cash</div>
                      <div className="text-lg font-mono text-good font-black tracking-tight">Φ {formatMoney(cash)}</div>
                    </div>
                    <div className="flex-1 p-3.5 bg-black/35 border border-line rounded-sm relative overflow-hidden">
                      <div className="text-[8px] font-heading font-black text-muted uppercase tracking-[0.15em] mb-1.5">Asset Valuation</div>
                      <div className="text-lg font-mono text-white/95 font-black tracking-tight">Φ {formatMoney(netWorth - cash)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Missions Section */}
              {user && missions.length > 0 && (
                <div className="glass-panel p-6 rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <DailyMissions missions={missions} onClaim={handleClaimMission} />
                </div>
              )}

              {/* Holdings */}
              {user && (
                <div className="space-y-6 mt-4 animate-fade-in-up">
                  <div className="glass-panel p-6 rounded-md flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden group">
                    <div className="laser-sweep" />
                    <div className="flex items-center gap-3.5">
                      <div className="w-2 h-8 bg-brand rounded-full animate-pulse shadow-[0_0_10px_var(--color-brand)]" />
                      <div className="text-left">
                        <h2 className="text-2xl font-heading font-black italic tracking-tighter text-white uppercase">[ SECURE_ASSET_LOCKER ]</h2>
                        <p className="text-[9px] text-muted font-mono tracking-widest uppercase">CONFIRMED HOLDINGS DECK</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[8px] font-heading font-black text-brand tracking-widest uppercase">Portfolio Valuation</span>
                      <div className="text-3xl font-mono text-white font-black tracking-tight flex items-center gap-1.5 leading-none">
                        <span className="text-brand text-xl">Φ</span>
                        {formatMoney(netWorth - cash)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(Object.entries(holdings) as [string, number][]).map(([id, shares]) => {
                      const char = market.find(c => c.id === id);
                      if (!char || shares <= 0) return null;
                      return (
                        <div key={id} className="relative group">
                          <div className="absolute top-2 right-2 bg-brand text-white z-20 px-2 py-1 text-[10px] font-mono font-bold clip-corner shadow-lg">QTY: {shares}</div>
                          <MarketCard char={char} onTrade={setTradeChar} onCardClick={handleCardClick} isFrozen={frozenIds.includes(id)} tradingEnabled={settings.tradingEnabled} multiplier={settings.event?.active ? settings.event.priceMultiplier : 1} />
                        </div>
                      );
                    })}
                    {(Object.entries(holdings) as [string, number][]).filter(([_, shares]) => shares > 0).length === 0 && (
                      <div className="col-span-full py-16 text-center text-muted font-mono text-xs uppercase tracking-widest glass-panel border border-line">No secure assets detected in locker.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {view === 'market' && <Market market={market} search={search} setSearch={handleSearch} onTrade={user ? setTradeChar : () => setShowAuthModal(true)} onCardClick={handleCardClick} settings={settings} frozenIds={frozenIds} recentSearches={recentSearches} onClearRecentSearches={() => { clearRecentSearches(); setRecentSearchesState([]); }} />}
        {view === 'waifu' && <WaifuPanel market={market} search={search} setSearch={handleSearch} onTrade={user ? setTradeChar : () => setShowAuthModal(true)} onCardClick={handleCardClick} settings={settings} frozenIds={frozenIds} />}
        {view === 'news' && <div className="max-w-3xl mx-auto space-y-4">{news.map(n => <NewsCard key={n.id} item={n} onJumpToMarket={c => { setSearch(c); setView('market'); }} />)}</div>}
        
        {view === 'trades' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="glass-panel p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-heading text-white italic tracking-tighter">LIVE_EXCHANGE_FEED</h2>
                <p className="text-[10px] text-muted font-mono uppercase tracking-widest">Real-time Node Activity</p>
              </div>
            </div>
            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-black/40 text-brand uppercase tracking-widest border-b border-line">
                    <tr>
                      <th className="p-4">Side</th>
                      <th className="p-4">Agent</th>
                      <th className="p-4">Character</th>
                      <th className="p-4">Qty</th>
                      <th className="p-4 text-right">Value</th>
                      <th className="p-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trades.map((t, i) => (
                      <tr key={i} className={`hover:bg-white/5 transition-all duration-200 ${t.isWhale ? 'bg-amber-500/5' : ''}`}>
                        <td className={`p-4 font-black ${t.side === 'BUY' ? 'text-good' : 'text-bad'}`}>{t.side}</td>
                        <td className="p-4 text-white uppercase">{t.username}</td>
                        <td className="p-4 text-muted uppercase">{t.character}</td>
                        <td className="p-4 text-white">{t.qty}</td>
                        <td className="p-4 text-right text-white">Φ {formatMoney(t.total)}</td>
                        <td className="p-4 text-right text-white/30">{formatTime(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {view === 'portfolio' && (
          <div className="space-y-4 animate-fade-in-up">
            {user && (
              <>
                {/* Portfolio Performance Chart */}
                <div className="glass-panel p-6 rounded-md relative overflow-hidden group">
                  <div className="laser-sweep" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 bg-brand rounded-full animate-pulse" />
                    <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.15em]">[ PORTFOLIO PERFORMANCE ]</h3>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <PortfolioChart history={netWorthHistory} width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)} height={180} />
                  </div>
                </div>

                {/* Streak Banner */}
                {streak > 0 && (
                  <div className="premium-card p-4 rounded-lg relative overflow-hidden group">
                    <div className="laser-sweep" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl animate-float">🔥</span>
                        <div>
                          <div className="text-xs font-heading font-black text-white uppercase tracking-wider">Day {streak} Login Streak</div>
                          <div className="text-[9px] font-mono text-muted/60">Keep logging in for bigger bonuses</div>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowMysteryBox(true)}
                        className="!py-2 !px-4 text-[9px] tracking-widest font-heading font-black"
                        variant="secondary"
                      >
                        🎁 Mystery Boxes
                      </Button>
                    </div>
                  </div>
                )}

                <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                  <div>
                    <h2 className="text-2xl font-heading text-white">ASSET ALLOCATION</h2>
                    <p className="text-xs text-muted font-mono">CONFIRMED HOLDINGS</p>
                  </div>
                  <div className="text-4xl font-mono text-brand border-b-2 border-brand px-4 pb-1">Φ {formatMoney(netWorth - cash)}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.entries(holdings) as [string, number][]).map(([id, shares]) => {
                    const char = market.find(c => c.id === id);
                    if (!char) return null;
                    return (
                      <div key={id} className="relative group">
                        <div className="absolute top-2 right-2 bg-brand text-white z-20 px-2 py-1 text-[10px] font-mono font-bold clip-corner shadow-lg">QTY: {shares}</div>
                        <MarketCard char={char} onTrade={setTradeChar} onCardClick={handleCardClick} isFrozen={frozenIds.includes(id)} tradingEnabled={settings.tradingEnabled} multiplier={settings.event?.active ? settings.event.priceMultiplier : 1} />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {view === 'leaderboard' && (
          <div className="glass-panel overflow-hidden animate-fade-in-up">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-black/40 text-brand uppercase tracking-widest">
                <tr><th className="p-4">Rank</th><th className="p-4">Agent</th><th className="p-4 text-right">Net Worth</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leaderboard.map((u, i) => (
                  <tr key={i} className={u.username === username ? 'bg-white/5' : ''}>
                    <td className="p-4 font-bold text-white">{i + 1}</td>
                    <td className="p-4 text-muted">{u.username}</td>
                    <td className="p-4 text-right text-white">Φ {formatMoney(u.netWorth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'profile' && user && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-brand/10 to-transparent border-l-4 border-brand p-8 shadow-2xl group">
              <div className="laser-sweep" />
              <h2 className="text-4xl font-heading text-white italic mb-1 uppercase tracking-tighter">AGENT <span className="text-brand text-transparent bg-clip-text bg-gradient-to-r from-brand to-pink-500">DECK</span></h2>
              <p className="text-[10px] text-brand/80 font-mono tracking-[0.25em] uppercase">SYSTEM CREDENTIAL MANAGEMENT MODULE</p>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
                <span className="text-[8px] font-mono text-white/40">NODE_VERIFIED</span>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-md space-y-6 relative overflow-hidden group">
              <div className="laser-sweep" />
              <div className="grid grid-cols-2 gap-4 border-b border-line pb-6">
                <div>
                  <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest block mb-1">Session Node ID</span>
                  <span className="text-xs font-mono font-bold text-white uppercase truncate block max-w-full">{user.uid}</span>
                </div>
                <div>
                  <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest block mb-1">Network Identity</span>
                  <span className="text-xs font-mono font-bold text-white block">{user.email}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 bg-brand rounded-full animate-pulse" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">[ CONFIG_CALLSIGN ]</h3>
                </div>
                <Input label="Active Alias / Username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Enter new alias..." className="bg-black/60 border border-line focus:border-brand rounded-md font-mono text-xs" />
                {profileMessage.text && (
                  <div className={`text-[10px] font-mono p-3 rounded-md border ${profileMessage.type === 'success' ? 'bg-good/10 text-good border-good/20' : 'bg-bad/10 text-bad border-bad/20'}`}>
                    {profileMessage.text.toUpperCase()}
                  </div>
                )}
                <Button onClick={handleUpdateUsername} disabled={isUpdatingProfile} className="w-full !py-3 font-heading font-black text-[10px] tracking-widest shadow-lg">
                  {isUpdatingProfile ? "ESTABLISHING HANDSHAKE..." : "COMMIT CALLSIGN UPDATE"}
                </Button>
              </div>
            </div>

            {/* Achievements Section */}
            <div className="glass-panel p-6 rounded-md relative overflow-hidden group">
              <div className="laser-sweep" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand)]" />
                <h3 className="text-xs font-heading font-black text-white uppercase tracking-[0.15em]">[ ACHIEVEMENTS ]</h3>
                <span className="text-[8px] font-mono text-muted/50 ml-auto">{badges.length}/{ACHIEVEMENTS.length} Unlocked</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACHIEVEMENTS.map(ach => (
                  <AchievementBadge key={ach.id} id={ach.id} name={ach.name} description={ach.description} icon={ach.icon} unlocked={badges.includes(ach.id)} />
                ))}
              </div>
            </div>

            {/* Daily Missions in Profile */}
            <div className="glass-panel p-6 rounded-md relative overflow-hidden group">
              <div className="laser-sweep" />
              <DailyMissions missions={missions} onClaim={handleClaimMission} />
            </div>
          </div>
        )}

        {view === 'admin' && isAdmin && (
          <div className="space-y-8 animate-fade-in-up">
            <AdminPanel settings={settings} market={market} isMainAdmin={user?.email === ADMIN_EMAIL} />
            <AdminTools market={market} />
          </div>
        )}

        {view === 'popularity' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-brand/10 to-transparent border-l-4 border-brand p-8 shadow-2xl group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                  <h2 className="text-5xl font-heading text-white italic tracking-tighter drop-shadow-lg">POPULARITY <span className="text-brand text-transparent bg-clip-text bg-gradient-to-r from-brand to-pink-500">POLLS</span></h2>
                  <p className="text-xs text-brand/80 font-mono font-bold tracking-[0.3em] uppercase mt-2 pl-1">Daily Community Reputation Consensus</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm backdrop-blur-md shadow-lg border ${settings.popularityVotingEnabled ? 'bg-good/20 border-good/30 text-good' : 'bg-bad/20 border-bad/30 text-bad'}`}>
                    {settings.popularityVotingEnabled ? 'VOTING_ACTIVE' : 'VOTING_LOCKED'}
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-12 text-[12rem] text-brand/5 select-none font-heading italic pointer-events-none group-hover:scale-105 transition-transform duration-1000 ease-out">♥</div>
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand/5 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none" />
            </div>
            <div className="flex justify-center gap-4 mb-8">
              <button onClick={() => setPopTab('Male')} className={`px-10 py-3 font-heading text-lg italic uppercase tracking-widest skew-x-[-12deg] border transition-all ${popTab === 'Male' ? 'bg-brand text-white border-brand shadow-[0_0_20px_rgba(225,29,72,0.35)]' : 'bg-black/40 text-muted border-line hover:text-white hover:bg-black/60'}`}>
                <span className="inline-block skew-x-[12deg]">Male Sector</span>
              </button>
              <button onClick={() => setPopTab('Female')} className={`px-10 py-3 font-heading text-lg italic uppercase tracking-widest skew-x-[-12deg] border transition-all ${popTab === 'Female' ? 'bg-[#FF007F] text-white border-[#FF007F] shadow-[0_0_20px_rgba(255,0,127,0.35)]' : 'bg-black/40 text-muted border-line hover:text-white hover:bg-black/60'}`}>
                <span className="inline-block skew-x-[12deg]">Female Sector</span>
              </button>
            </div>
            <div className="space-y-4">
              {market.filter(c => (c.gender || 'Male') === popTab).sort((a, b) => (b.popularityVotes || 0) - (a.popularityVotes || 0)).map((c, i) => {
                const currentRank = i + 1;
                const placeholder = "/assets/placeholder-character.png";
                let tierColor = "text-muted border-line bg-white/[0.02]";
                if (currentRank === 1) tierColor = "text-brand border-brand/50 bg-brand/10 shadow-[0_0_12px_rgba(225,29,72,0.15)]";
                else if (currentRank <= 3) tierColor = "text-[#00F0FF] border-[#00F0FF]/40 bg-[#00F0FF]/5";
                return (
                  <div key={c.id} className="relative group overflow-hidden border border-line bg-card/40 hover:border-brand/40 transition-all duration-300 flex flex-col sm:flex-row items-center justify-between p-4 rounded-md gap-4">
                    <div className="laser-sweep" />
                    <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                      <div className="font-heading font-black italic text-3xl w-12 text-center text-white/25 group-hover:text-brand transition-colors select-none leading-none">#{currentRank.toString().padStart(2, '0')}</div>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-black border border-line overflow-hidden shrink-0 shadow-md group-hover:border-brand/50 transition-colors">
                          <img src={c.imageUrl || placeholder} className="stockism-character-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.src = placeholder; }} />
                        </div>
                        <div>
                          <h4 className="font-heading text-xl font-bold leading-none text-white uppercase group-hover:text-brand transition-colors">{c.name}</h4>
                          <div className="text-[10px] text-muted font-mono mt-1 uppercase tracking-wider">{c.crew}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto relative z-10 border-t sm:border-t-0 border-line/40 pt-4 sm:pt-0">
                      <div className="text-right min-w-[80px]">
                        <div className="text-2xl font-mono text-white font-black tracking-tight">{c.popularityVotes || 0}</div>
                        <div className="text-[7px] text-muted font-heading font-black tracking-widest uppercase">TOTAL VOTES</div>
                      </div>
                      <Button onClick={() => handleVote(c.id, c.gender || 'Male')} disabled={!settings.popularityVotingEnabled} className="shadow-md !py-2.5 !px-6 text-[10px] tracking-widest font-heading font-black shrink-0">VOTE</Button>
                    </div>
                    {currentRank === 1 && (<div className={`absolute inset-0 bg-gradient-to-r ${popTab === 'Female' ? 'from-[#FF007F]/5' : 'from-brand/5'} via-transparent to-transparent pointer-events-none`} />)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'strongest' && <StrongestRank market={market} settings={settings} onVote={handleStrongestVote} />}

        {tradeChar && user && (
          <TradeModal
            char={tradeChar}
            onClose={() => setTradeChar(null)}
            onExecute={handleTrade}
            holdings={holdings[tradeChar.id] || 0}
            cash={cash}
            settings={settings}
            lastTradeAt={lastTradeAt}
          />
        )}
      </Layout>

      {/* Mobile Bottom Nav */}
      <MobileNav activeView={view} setView={setView} isAdmin={isAdmin} isGuest={!user} />

      {/* Mystery Box Modal */}
      {showMysteryBox && user && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && setShowMysteryBox(false)}>
          <div className="w-full max-w-2xl glass-panel border border-line rounded-lg p-6 animate-zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-brand rounded-full animate-pulse" />
                <h2 className="text-lg font-heading text-white italic tracking-tighter uppercase">🎁 Mystery Boxes</h2>
              </div>
              <button onClick={() => setShowMysteryBox(false)} className="text-muted hover:text-white text-sm font-mono">✕</button>
            </div>
            <div className="text-[10px] font-mono text-muted/60 mb-6">
              Your Balance: <span className="text-white font-bold">Φ {formatMoney(cash)}</span>
            </div>
            <MysteryBoxShop uid={user.uid} cash={cash} onRefresh={() => {}} />
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          animationsEnabled={animationsEnabled}
          onToggleAnimations={handleToggleAnimations}
          theme={localStorage.getItem('stockism-theme') || 'dark'}
          onToggleTheme={() => {
            const current = localStorage.getItem('stockism-theme') || 'dark';
            const next = current === 'dark' ? 'neon' : 'dark';
            localStorage.setItem('stockism-theme', next);
            window.location.reload();
          }}
          badges={badges}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAuthModal && !user && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <OnboardingPortal onSuccess={() => setShowAuthModal(false)} onClose={() => setShowAuthModal(false)} />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
