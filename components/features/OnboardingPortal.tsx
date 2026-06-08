import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  const [typedTitle, setTypedTitle] = useState('');
  const [showContent, setShowContent] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: "19:40:02", type: 'SYS', message: "System core boot successful. Version 1.4.2-L" },
    { timestamp: "19:40:03", type: 'SYS', message: "Vite dev server: Hot module reloading online" },
    { timestamp: "19:40:03", type: 'CONN', message: "Firebase connection: ESTABLISHED on secure node" },
    { timestamp: "19:40:04", type: 'SYS', message: "Waiting for agent authentication protocol..." }
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // 3D tilt on mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x: x * 6, y: y * -6 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: 0, y: 0 });
  }, []);

  // Typewriter effect on slide change
  useEffect(() => {
    setTypedTitle('');
    setShowContent(false);
    const t = setTimeout(() => {
      let i = 0;
      const title = BRIEFING_SLIDES[currentSlide].title;
      const interval = setInterval(() => {
        setTypedTitle(title.slice(0, i + 1));
        i++;
        if (i >= title.length) {
          clearInterval(interval);
          setTimeout(() => setShowContent(true), 150);
        }
      }, 25);
      return () => clearInterval(interval);
    }, 200);
    return () => clearTimeout(t);
  }, [currentSlide]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

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

  // 3D floating particles
  const particles = useMemo(() => {
    return Array.from({ length: 24 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 8,
      size: 2 + Math.random() * 4,
      color: ['#E11D48', '#00F0FF', '#FF007F', '#10B981', '#F59E0B'][Math.floor(Math.random() * 5)],
      blur: Math.random() * 3,
    }));
  }, []);

  // Floating geometric shapes
  const shapes = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 30 + Math.random() * 80,
      rotation: Math.random() * 360,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * 5,
      opacity: 0.02 + Math.random() * 0.04,
      border: Math.random() > 0.5 ? '50%' : '4px',
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
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      addLog('ERROR', `Handshake rejected: ${err.message || err.toString()}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg0 text-white font-body overflow-hidden flex items-center justify-center p-3 md:p-6 relative selection:bg-brand">
      {/* CRT overlay */}
      <div className="crt-overlay" />
      
      {/* Animated background gradient mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1.2px,transparent_1.2px)] [background-size:28px_28px]" />
        {/* Morphing gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] rounded-full bg-brand/5 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-20 w-[350px] h-[350px] rounded-full bg-[#00F0FF]/5 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand/3 blur-[120px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        
        {/* Floating geometric shapes */}
        {shapes.map((s, i) => (
          <div
            key={i}
            className="absolute border border-white/10 pointer-events-none"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              borderRadius: s.border,
              transform: `rotate(${s.rotation}deg)`,
              opacity: s.opacity,
              animation: `float ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 3D floating neon particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${6 + p.blur * 2}px ${p.color}40, 0 0 ${12 + p.blur * 3}px ${p.color}20`,
              animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Main 3D Glass Card */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="card-3d w-full max-w-6xl"
        style={{
          perspective: '1200px',
        }}
      >
        <div
          className="card-3d-inner w-full glass-panel rounded-2xl overflow-hidden border border-white/10 z-10 flex flex-col lg:flex-row relative"
          style={{
            transform: `rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg)`,
            transition: mousePos.x === 0 && mousePos.y === 0 ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            background: 'linear-gradient(135deg, rgba(20,20,23,0.7), rgba(28,28,33,0.3))',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), 0 0 40px rgba(225,29,72,0.08)',
          }}
        >
          {/* Glass reflection overlay */}
          <div className="glass-gloss absolute inset-0 pointer-events-none z-[1]" />
          
          <div className="laser-sweep" />

          {onClose && (
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 z-50 text-muted hover:text-white transition-all px-3 py-1.5 font-heading text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md border border-white/10 hover:border-brand/50 rounded-lg active:scale-90 hover:shadow-[0_0_15px_rgba(225,29,72,0.2)]"
            >
              ✕ CLOSE
            </button>
          )}

          {/* LEFT: Briefing Panel */}
          <div className="lg:w-7/12 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/5 bg-gradient-to-br from-black/40 to-transparent flex flex-col justify-between min-h-[450px] lg:min-h-[580px] relative overflow-hidden">
            {/* Accent edge glow */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand via-brand/50 to-transparent opacity-60" />
            
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="relative flex w-3 h-3">
                    <span className="animate-ping absolute inset-0 rounded-full bg-brand opacity-75" />
                    <span className="relative rounded-full w-3 h-3 bg-brand shadow-[0_0_12px_var(--color-brand)]" />
                  </span>
                  <span className="text-[8px] font-heading font-black tracking-[0.2em] text-brand/80 uppercase">Gateway Active</span>
                </div>
                <span className="text-[9px] font-mono text-white/10">v1.4.2</span>
              </div>

              <div className="space-y-6 min-h-[240px]">
                <div className="text-[10px] font-heading font-black text-brand tracking-widest pl-1 animate-fade-in-up">
                  {BRIEFING_SLIDES[currentSlide].protocol}
                </div>
                
                {/* Typewriter title */}
                <h2 className="text-4xl md:text-5xl font-heading font-black italic tracking-tighter drop-shadow-lg uppercase min-h-[56px]">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-brand/80">
                    {typedTitle}
                  </span>
                  <span className="animate-pulse text-brand">▌</span>
                </h2>
                
                {showContent && (
                  <p className="text-sm text-white/60 leading-relaxed max-w-lg font-light animate-fade-in-up">
                    {BRIEFING_SLIDES[currentSlide].description}
                  </p>
                )}
              </div>
            </div>

            {/* Code block */}
            <div className="mt-6 font-mono text-[10px] bg-black/60 backdrop-blur-md border border-white/5 p-4 rounded-lg text-white/60 overflow-hidden relative select-none group hover:border-brand/20 transition-all duration-300">
              <div className="absolute top-2 right-3 text-[7px] font-mono text-white/10 uppercase tracking-widest">stream</div>
              <pre className="whitespace-pre-wrap">{BRIEFING_SLIDES[currentSlide].code}</pre>
              {/* Scanline effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-[-100%] group-hover:translate-y-[100%]" style={{ transition: 'all 2s linear' }} />
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-3 mt-8">
              {BRIEFING_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-500 rounded-full ${
                    currentSlide === idx 
                      ? 'w-10 h-1.5 bg-brand shadow-[0_0_8px_var(--color-brand)]' 
                      : 'w-2 h-1.5 bg-white/10 hover:bg-white/30'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
              <span className="ml-auto text-[8px] font-mono text-white/10">
                {currentSlide + 1} / {BRIEFING_SLIDES.length}
              </span>
            </div>
          </div>

          {/* RIGHT: Auth Panel */}
          <div className="lg:w-5/12 p-8 lg:p-12 flex flex-col justify-between bg-gradient-to-tl from-black/30 to-transparent relative overflow-hidden">
            {/* Accent edge glow */}
            <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-brand/40 via-brand/20 to-transparent opacity-40" />
            
            <div>
              {/* Tabs */}
              <div className="flex border-b border-white/5 mb-8 gap-1">
                <button
                  onClick={() => { setIsSignup(false); addLog('SYS', "Mode: AUTHENTICATION."); }}
                  className={`flex-1 pb-3 text-xs font-heading font-black tracking-widest uppercase text-center transition-all ${
                    !isSignup 
                      ? 'text-white border-b-2 border-brand' 
                      : 'text-muted/40 hover:text-white/60 border-b-2 border-transparent'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setIsSignup(true); addLog('SYS', "Mode: REGISTRATION."); }}
                  className={`flex-1 pb-3 text-xs font-heading font-black tracking-widest uppercase text-center transition-all ${
                    isSignup 
                      ? 'text-white border-b-2 border-brand' 
                      : 'text-muted/40 hover:text-white/60 border-b-2 border-transparent'
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div className="space-y-1 group">
                  <label className="text-[9px] font-heading font-black text-muted/60 group-focus-within:text-brand tracking-widest uppercase transition-colors">Agent Email</label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="AGENT@STOCKISM.COM"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg font-mono text-xs uppercase focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all group-focus-within:shadow-[0_0_20px_rgba(225,29,72,0.08)]"
                      required
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-brand to-transparent group-focus-within:w-full transition-all duration-500" />
                  </div>
                </div>

                <div className="space-y-1 group">
                  <label className="text-[9px] font-heading font-black text-muted/60 group-focus-within:text-brand tracking-widest uppercase transition-colors">Cryptokey</label>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder="••••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg font-mono text-xs focus:border-brand/50 focus:ring-1 focus:ring-brand/20 transition-all group-focus-within:shadow-[0_0_20px_rgba(225,29,72,0.08)]"
                      required
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-brand to-transparent group-focus-within:w-full transition-all duration-500" />
                  </div>
                </div>

                {isSignup && (
                  <div className="p-4 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent border border-brand/20 rounded-lg flex justify-between items-center text-[10px] group hover:border-brand/40 transition-all">
                    <div>
                      <span className="font-heading font-black text-muted uppercase tracking-wider block">Signup Bounty</span>
                      <span className="text-[8px] font-mono text-muted/50">New agent registration bonus</span>
                    </div>
                    <span className="font-mono text-brand font-black text-lg drop-shadow-[0_0_8px_rgba(225,29,72,0.3)]">Φ 5K</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full !py-3.5 shadow-lg font-heading font-black text-[10px] tracking-widest rounded-lg relative overflow-hidden group/btn"
                >
                  <span className="relative z-10">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        LINKING...
                      </span>
                    ) : (isSignup ? "AUTHORIZE & REGISTER" : "CONNECT SECURE DECK")}
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-all duration-700" />
                </Button>
              </form>
            </div>

            {/* Diagnostic Terminal */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1 h-3 bg-brand/60 rounded-full animate-pulse" />
                <span className="text-[8px] font-heading font-black text-muted/40 uppercase tracking-widest">Gateway Log</span>
              </div>
              <div 
                ref={logContainerRef}
                className="h-28 bg-black/60 backdrop-blur-sm border border-white/5 p-3 rounded-lg font-mono text-[9px] text-white/40 overflow-y-auto space-y-1 custom-scrollbar scroll-smooth"
              >
                {logs.map((log, i) => {
                  const colorMap = {
                    SYS: 'text-white/40',
                    AUTH: 'text-brand',
                    CONN: 'text-cyan-400',
                    ERROR: 'text-bad font-bold',
                    SUCCESS: 'text-good font-bold'
                  };
                  return (
                    <div key={i} className="flex gap-2 leading-relaxed animate-fade-in-up" style={{ animationDelay: `${i * 0.02}s` }}>
                      <span className="text-white/10 select-none">[{log.timestamp}]</span>
                      <span className={`${colorMap[log.type]} font-bold`}>[{log.type}]</span>
                      <span className="text-white/60">{log.message}</span>
                    </div>
                  );
                })}
                {loading && (
                  <div className="flex items-center gap-2 text-brand/60">
                    <span className="w-2 h-2 bg-brand rounded-full animate-pulse" />
                    Processing...
                  </div>
                )}
              </div>
            </div>

            {/* Guest bypass */}
            {onBypass && (
              <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <button
                  onClick={onBypass}
                  className="text-[9px] font-heading font-black text-muted/30 hover:text-brand/60 tracking-[0.2em] transition-all uppercase"
                >
                  [ Browse as Guest ]
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
