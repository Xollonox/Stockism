import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../../services/firebase';
import * as Auth from 'firebase/auth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface OnboardingPortalProps {
  onSuccess: () => void;
  onBypass?: () => void;
  onClose?: () => void;
}

interface LogEntry {
  timestamp: string;
  type: 'SYS' | 'AUTH' | 'CONN' | 'ERROR' | 'SUCCESS';
  message: string;
}

const BRIEFING_SLIDES = [
  {
    protocol: "SPECUATION_PROTOCOL // 01",
    title: "Speculation Elite Assets",
    description: "Secure and trade contracts for Lookism's strongest fighters. Build your portfolio as active value nodes shift dynamically based on real-time market activity.",
    code: `>>> INITIALIZING EXCHANGE...
[NODE] Allied Crew: Active
[NODE] Workers 1st Affiliate: Active
[TICK] Johan Seong: Φ 4,920 (+4.8%)
[TICK] Daniel Park: Φ 5,100 (-2.1%)
[TICK] Gun Park: Φ 8,900 (+12.4%)`
  },
  {
    protocol: "LORE_DIAGNOSTIC // 02",
    title: "Deep Lore Scans",
    description: "Access comprehensive character intelligence. Verify canon backgrounds, affiliations, confirmed story feats, and relationship vectors directly from curated Lookism database indexes.",
    code: `>>> ENGAGING COGNITIVE GRID...
[SCAN] Target: Gun Park
[SCAN] Affiliation: Yamazaki Syndicate
[SCAN] Feat Check: Beat UI Daniel
[RESULT] Verification Complete: 100%
[STATUS] Story canon synced successfully.`
  },
  {
    protocol: "UNDERGROUND_SUPREMACY // 03",
    title: "Establish Domination",
    description: "Scale your financial net value. Rise through the underground agent rankings, assert your supremacy, and lock in your legacy in the Hall of Fame.",
    code: `>>> SCANNING POWER LEADERBOARD...
RANK 01: Agent_Eugene [Φ 4.2M]
RANK 02: Agent_Vivi   [Φ 3.1M]
RANK 03: Agent_Jake   [Φ 1.8M]
--------------------------------
[STATUS] Your Rank: UNAUTHORIZED`
  }
];

export const OnboardingPortal: React.FC<OnboardingPortalProps> = ({ onSuccess, onBypass, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Diagnostic Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "19:40:02", type: 'SYS', message: "System core boot successful. Version 1.4.2-L" },
    { timestamp: "19:40:03", type: 'SYS', message: "Vite dev server: Hot module reloading online" },
    { timestamp: "19:40:03", type: 'CONN', message: "Firebase connection: ESTABLISHED on secure node" },
    { timestamp: "19:40:04", type: 'SYS', message: "Waiting for agent authentication protocol..." }
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scrolling logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Autoplay slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BRIEFING_SLIDES.length);
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const addLog = (type: LogEntry['type'], message: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { timestamp: time, type, message }]);
  };

  // Generate background particles
  const particles = useMemo(() => {
    return Array.from({ length: 18 }).map(() => ({
      left: Math.random() * 100,
      bottom: Math.random() * 40,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 6,
      color: Math.random() > 0.5 ? '#00F0FF' : '#FF007F'
    }));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addLog('ERROR', "Handshake aborted: Missing credential parameters.");
      return;
    }

    setLoading(true);
    addLog('AUTH', `Initializing auth sequence for agent: ${email}...`);

    try {
      if (isSignup) {
        addLog('CONN', "Registering new agent node in secure database...");
        await Auth.createUserWithEmailAndPassword(auth, email, password);
        addLog('SUCCESS', `Registration protocol accepted. Welcome agent ${email}.`);
      } else {
        addLog('CONN', "Authorizing credentials against secure vault...");
        await Auth.signInWithEmailAndPassword(auth, email, password);
        addLog('SUCCESS', `Access granted. Loading command terminal modules...`);
      }
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      addLog('ERROR', `Handshake rejected: ${err.message || err.toString()}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg0 text-white font-body overflow-y-auto flex items-center justify-center p-4 md:p-8 relative selection:bg-brand">
      <div className="crt-overlay" />
      
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1.2px,transparent_1.2px)] [background-size:28px_28px]" />
        {particles.map((p, idx) => (
          <div
            key={idx}
            className="dust-particle"
            style={{
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              backgroundColor: p.color,
              boxShadow: `0 0 8px ${p.color}`
            }}
          />
        ))}
      </div>

      {/* Main Board Container */}
      <div className="w-full max-w-6xl glass-panel rounded-xl overflow-hidden border border-line z-10 flex flex-col lg:flex-row relative">
        <div className="laser-sweep" />

        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-muted hover:text-white transition-colors z-50 px-3 py-1 font-heading text-[9px] font-black uppercase tracking-widest bg-black/60 border border-line hover:border-brand rounded active:scale-95"
            title="Close Authentication Deck"
          >
            ✕ CLOSE_DECK
          </button>
        )}

        {/* Left Side: Cyber Briefings */}
        <div className="lg:w-7/12 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-line bg-black/30 flex flex-col justify-between min-h-[450px] lg:min-h-[580px]">
          <div>
            {/* Header logo/indicator */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-brand rounded-full animate-ping" />
                <span className="text-[8px] font-heading font-black tracking-[0.2em] text-brand">GATEWAY_DIAGNOSTIC://ACTIVE</span>
              </div>
              <span className="text-[9px] font-mono text-white/20">SYS_BUILD_1.4.2</span>
            </div>

            {/* Carousel/Briefing Info */}
            <div className="space-y-6 min-h-[220px]">
              <div className="text-[10px] font-heading font-black text-brand tracking-widest pl-1">
                {BRIEFING_SLIDES[currentSlide].protocol}
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-black italic tracking-tighter text-white drop-shadow-lg uppercase">
                {BRIEFING_SLIDES[currentSlide].title}
              </h2>
              <p className="text-sm text-muted leading-relaxed max-w-lg font-light">
                {BRIEFING_SLIDES[currentSlide].description}
              </p>
            </div>
          </div>

          {/* Diagnostic Code Printout inside slide */}
          <div className="mt-6 font-mono text-[10px] bg-black/60 border border-line p-4 rounded-md text-white/70 overflow-hidden relative select-none">
            <div className="absolute top-1 right-2 text-[8px] font-mono text-white/10 uppercase">Data Stream</div>
            <pre className="whitespace-pre-wrap">{BRIEFING_SLIDES[currentSlide].code}</pre>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center gap-3 mt-8">
            {BRIEFING_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 transition-all duration-300 rounded ${
                  currentSlide === idx ? 'w-8 bg-brand' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Auth System Form */}
        <div className="lg:w-5/12 p-8 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Tabs */}
            <div className="flex border-b border-line mb-8">
              <button
                onClick={() => {
                  setIsSignup(false);
                  addLog('SYS', "Mode switched to AGENT AUTHENTICATION.");
                }}
                className={`flex-1 pb-3 text-xs font-heading font-black tracking-widest uppercase text-center border-b-2 transition-all ${
                  !isSignup ? 'border-brand text-white' : 'border-transparent text-muted hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsSignup(true);
                  addLog('SYS', "Mode switched to NEW AGENT REGISTRATION.");
                }}
                className={`flex-1 pb-3 text-xs font-heading font-black tracking-widest uppercase text-center border-b-2 transition-all ${
                  isSignup ? 'border-brand text-white' : 'border-transparent text-muted hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black text-muted tracking-widest uppercase">Agent Email Node</label>
                <Input
                  type="email"
                  placeholder="AGENT_ID@STOCKISM.COM"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/40 border border-line rounded-md font-mono text-xs uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-heading font-black text-muted tracking-widest uppercase">Secret Cryptokey</label>
                <Input
                  type="password"
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/40 border border-line rounded-md font-mono text-xs"
                  required
                />
              </div>

              {isSignup && (
                <div className="p-3 bg-brand/5 border border-brand/20 rounded-md flex justify-between items-center text-[10px]">
                  <span className="font-heading font-black text-muted uppercase tracking-wider">Authentication Bounty</span>
                  <span className="font-mono text-brand font-black">Φ 5,000 BONUS</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full !py-3 shadow-lg font-heading font-black text-[10px] tracking-widest"
              >
                {loading ? "INITIALIZING SECURE LINK..." : (isSignup ? "AUTHORIZE & REGISTER" : "CONNECT SECURE DECK")}
              </Button>
            </form>
          </div>

          {/* Diagnostic Console Terminal */}
          <div className="mt-8 flex flex-col gap-2">
            <span className="text-[8px] font-heading font-black text-muted uppercase tracking-widest pl-1">Gateway Diagnostic Log</span>
            <div 
              ref={logContainerRef}
              className="h-28 bg-black/75 border border-line p-3 rounded-md font-mono text-[9px] text-white/50 overflow-y-auto space-y-1 custom-scrollbar scroll-smooth"
            >
              {logs.map((log, i) => {
                const colorMap = {
                  SYS: 'text-muted/60',
                  AUTH: 'text-brand',
                  CONN: 'text-[#00F0FF]',
                  ERROR: 'text-bad font-bold',
                  SUCCESS: 'text-good font-bold'
                };
                return (
                  <div key={i} className="flex gap-2 leading-relaxed">
                    <span className="text-white/20 select-none">[{log.timestamp}]</span>
                    <span className={`${colorMap[log.type]} font-bold`}>[{log.type}]</span>
                    <span className="text-white/80">{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bypass and explore as guest */}
          {onBypass && (
            <div className="mt-6 pt-6 border-t border-line text-center">
              <button
                onClick={onBypass}
                className="text-[9px] font-heading font-black text-muted hover:text-brand tracking-[0.2em] transition-all uppercase"
              >
                [ Bypass Gateway & Browse as Guest ]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
