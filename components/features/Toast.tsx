import React, { useState, useEffect, useCallback } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'achievement';
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

let toastIdCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast, i) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-slide-up flex items-start gap-3 p-4 rounded-sm border shadow-2xl backdrop-blur-xl min-w-[280px] max-w-[400px] transition-all cursor-pointer hover:scale-[1.02] ${
              toast.type === 'success' ? 'bg-good/10 border-good/30 text-good' :
              toast.type === 'error' ? 'bg-bad/10 border-bad/30 text-bad' :
              toast.type === 'achievement' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-white/5 border-line text-white'
            }`}
            onClick={() => removeToast(toast.id)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-lg shrink-0 mt-0.5">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'achievement' ? '🏆' : 'ℹ'}
            </span>
            <span className="text-xs font-mono leading-relaxed">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => React.useContext(ToastContext);
