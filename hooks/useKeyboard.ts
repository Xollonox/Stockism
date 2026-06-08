import { useEffect } from 'react';

type KeyAction = {
  key: string;
  ctrl?: boolean;
  action: () => void;
  description?: string;
};

export function useKeyboard(actions: KeyAction[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      for (const a of actions) {
        const keyMatch = e.key.toLowerCase() === a.key.toLowerCase();
        const ctrlMatch = a.ctrl ? (e.ctrlKey || e.metaKey) : true;
        if (keyMatch && ctrlMatch) {
          e.preventDefault();
          a.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actions, enabled]);
}

export const SHORTCUTS = [
  { key: '1', label: 'Dashboard' },
  { key: '2', label: 'Exchange' },
  { key: '3', label: 'Waifu Index' },
  { key: '4', label: 'Portfolio' },
  { key: '5', label: 'Leaderboard' },
  { key: '6', label: 'Trades Feed' },
  { key: 'Escape', label: 'Close Modal' },
  { key: 'M', label: 'Toggle Theme' },
];
