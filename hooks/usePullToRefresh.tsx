import React, { useRef, useCallback, useState } from 'react';

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const startY = useRef(0);
  const pullingRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      pullingRef.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullingRef.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      const pct = Math.min(diff / 120, 1);
      setProgress(pct);
      setPulling(true);
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;
    if (progress >= 0.8) {
      setPulling(true);
      setProgress(1);
      try { await onRefresh(); } catch {}
    }
    setPulling(false);
    setProgress(0);
  }, [progress, onRefresh]);

  return {
    pullHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    pulling,
    progress,
    PullIndicator: () => pulling ? (
      <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center h-16 bg-bg0/90 backdrop-blur-md border-b border-line animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 border-2 border-brand border-t-transparent rounded-full ${progress >= 1 ? 'animate-spin' : ''}`} />
          <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
            {progress >= 0.8 ? 'Release to refresh' : 'Pull to refresh'}
          </span>
        </div>
      </div>
    ) : null,
  };
}

// Haptic feedback
export const haptic = (pattern: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
  try {
    if (navigator.vibrate) {
      const durations = { light: 10, medium: 20, heavy: 40, selection: 5 };
      navigator.vibrate(durations[pattern]);
    }
  } catch {}
};
