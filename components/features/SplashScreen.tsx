import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const TYPING_TEXT = "> INITIALIZING STOCKISM EXCHANGE PROTOCOL...";

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [phase, setPhase] = useState<'boot' | 'logo' | 'done'>('boot');
  const [typed, setTyped] = useState('');
  const [dots, setDots] = useState('');
  const [glitch, setGlitch] = useState(false);

  // Typing effect
  useEffect(() => {
    if (phase !== 'boot') return;
    if (typed.length < TYPING_TEXT.length) {
      const t = setTimeout(() => {
        setTyped(TYPING_TEXT.slice(0, typed.length + 1));
        if (Math.random() < 0.15) setGlitch(true);
        else setGlitch(false);
      }, 25 + Math.random() * 30);
      return () => clearTimeout(t);
    } else {
      setTimeout(() => setPhase('logo'), 600);
    }
  }, [typed, phase]);

  // Dots animation
  useEffect(() => {
    if (phase !== 'logo') return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    setTimeout(() => setPhase('done'), 2500);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') {
      setTimeout(onFinish, 300);
    }
  }, [phase, onFinish]);

  if (phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-bg0 flex flex-col items-center justify-center overflow-hidden">
      {/* Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] pointer-events-none z-10" />
      
      {/* Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:32px_32px] opacity-30 pointer-events-none" />

      {phase === 'boot' && (
        <div className="relative z-20 text-center px-8">
          <div className="font-mono text-sm text-brand mb-8 tracking-wider" style={{ minHeight: '1.5em' }}>
            <span className={glitch ? 'opacity-50' : ''}>{typed}</span>
            <span className="animate-pulse">▌</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted/50">
            <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
            <span>SECURE BOOT SEQUENCE</span>
          </div>
        </div>
      )}

      {phase === 'logo' && (
        <div className="relative z-20 text-center animate-fade-in-up">
          <h1 className="text-7xl md:text-9xl font-heading text-white italic tracking-tighter select-none" style={{ textShadow: '0 0 40px rgba(225,29,72,0.4), 0 0 80px rgba(225,29,72,0.2)' }}>
            STOCK<span className="text-brand">ISM</span>
          </h1>
          <div className="mt-6 flex items-center justify-center gap-3 text-muted/60 font-mono text-xs tracking-[0.3em] uppercase">
            <span className="w-1.5 h-1.5 bg-good rounded-full animate-ping" />
            <span>System Online{dots}</span>
          </div>
          <div className="mt-8 w-48 h-[2px] mx-auto bg-gradient-to-r from-transparent via-brand/50 to-transparent" />
        </div>
      )}
    </div>
  );
};
