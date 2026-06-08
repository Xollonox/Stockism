import { useCallback, useRef } from 'react';

// Web Audio API synth sounds — no external files needed
const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!AudioCtx) return null;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    return ctxRef.current;
  }, []);

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08) => {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, [getCtx]);

  const playNoise = useCallback((duration: number, volume = 0.03) => {
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }, [getCtx]);

  const sounds = {
    trade: () => { playTone(880, 0.1, 'sine', 0.06); setTimeout(() => playTone(1320, 0.15, 'sine', 0.04), 60); },
    buy: () => { playTone(1047, 0.12, 'sine', 0.06); setTimeout(() => playTone(1319, 0.1, 'sine', 0.04), 80); },
    sell: () => { playTone(587, 0.15, 'triangle', 0.07); },
    click: () => { playTone(1200, 0.03, 'square', 0.03); },
    hover: () => { playTone(2000, 0.02, 'sine', 0.02); },
    success: () => { playTone(523, 0.1, 'sine', 0.05); setTimeout(() => playTone(659, 0.1, 'sine', 0.05), 100); setTimeout(() => playTone(784, 0.15, 'sine', 0.05), 200); },
    error: () => { playTone(200, 0.2, 'sawtooth', 0.05); setTimeout(() => playTone(150, 0.3, 'sawtooth', 0.04), 150); },
    achievement: () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.1), 100); setTimeout(() => playTone(784, 0.1), 200); setTimeout(() => playTone(1047, 0.2), 300); },
    notification: () => { playTone(880, 0.08, 'sine', 0.04); setTimeout(() => playTone(1109, 0.08, 'sine', 0.03), 100); },
    boost: () => { playTone(440, 0.3, 'sawtooth', 0.03); },
  };

  return sounds;
}
