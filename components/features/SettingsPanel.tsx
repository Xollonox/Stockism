import React from 'react';
import { Button } from '../ui/Button';
import { ACHIEVEMENTS } from '../../utils/achievements';

interface SettingsPanelProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  animationsEnabled: boolean;
  onToggleAnimations: () => void;
  theme: string;
  onToggleTheme: () => void;
  badges: string[];
  onClose: () => void;
  aiAgentActive?: boolean;
  onToggleAIAgent?: () => void;
  onTriggerAICycle?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  soundEnabled, onToggleSound,
  animationsEnabled, onToggleAnimations,
  theme, onToggleTheme,
  badges, onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg glass-panel border border-line rounded-md p-6 animate-zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 bg-brand rounded-full animate-pulse" />
            <h2 className="text-lg font-heading text-white italic tracking-tighter uppercase">SYSTEM CONFIG</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-sm font-mono">✕</button>
        </div>

        <div className="space-y-6">
          {/* Theme */}
          <div className="p-4 bg-black/30 border border-line rounded-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-heading font-black text-white uppercase tracking-wider">Interface Protocol</div>
                <div className="text-[9px] font-mono text-muted/60 mt-0.5">Toggle between CARBON and NEON mode</div>
              </div>
              <button
                onClick={onToggleTheme}
                className={`px-4 py-2 text-[10px] font-heading font-black uppercase tracking-widest border transition-all rounded-sm ${
                  theme === 'neon'
                    ? 'bg-[#00F0FF]/10 border-[#00F0FF]/40 text-[#00F0FF]'
                    : 'bg-brand/10 border-brand/40 text-brand'
                }`}
              >
                {theme === 'dark' ? '→ NEON' : '→ CARBON'}
              </button>
            </div>
          </div>

          {/* Sound */}
          <div className="p-4 bg-black/30 border border-line rounded-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-heading font-black text-white uppercase tracking-wider">Audio Feedback</div>
                <div className="text-[9px] font-mono text-muted/60 mt-0.5">Synth sounds for trades, clicks, achievements</div>
              </div>
              <button
                onClick={onToggleSound}
                className={`w-14 h-7 rounded-full border transition-all relative ${
                  soundEnabled ? 'bg-brand/30 border-brand/50' : 'bg-black/40 border-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full absolute top-1 transition-all duration-300 ${
                  soundEnabled ? 'left-[30px] bg-brand shadow-[0_0_8px_var(--color-brand)]' : 'left-1 bg-muted/50'
                }`} />
              </button>
            </div>
          </div>

          {/* Animations */}
          <div className="p-4 bg-black/30 border border-line rounded-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-heading font-black text-white uppercase tracking-wider">Motion Effects</div>
                <div className="text-[9px] font-mono text-muted/60 mt-0.5">3D tilt, particles, transitions</div>
              </div>
              <button
                onClick={onToggleAnimations}
                className={`w-14 h-7 rounded-full border transition-all relative ${
                  animationsEnabled ? 'bg-brand/30 border-brand/50' : 'bg-black/40 border-white/10'
                }`}
              >
                <div className={`w-5 h-5 rounded-full absolute top-1 transition-all duration-300 ${
                  animationsEnabled ? 'left-[30px] bg-brand shadow-[0_0_8px_var(--color-brand)]' : 'left-1 bg-muted/50'
                }`} />
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-4 bg-black/30 border border-line rounded-sm">
            <div className="text-xs font-heading font-black text-white uppercase tracking-wider mb-3">⌨ Keyboard Shortcuts</div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {[
                ['1', 'Dashboard'], ['2', 'Exchange'], ['3', 'Waifu'], ['4', 'Portfolio'],
                ['5', 'Leaderboard'], ['6', 'Trades'], ['Esc', 'Close Modal'], ['M', 'Toggle Theme'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-black/60 border border-line rounded text-[9px] font-bold text-brand">{key}</kbd>
                  <span className="text-muted">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Agent */}
          {onToggleAIAgent && (
            <div className="p-4 bg-black/30 border border-line rounded-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                    🧠 AI Market Agent
                    {aiAgentActive && <span className="w-2 h-2 bg-brand rounded-full animate-ping" />}
                  </div>
                  <div className="text-[9px] font-mono text-muted/60 mt-0.5">Auto-fluctuates prices & generates news every 15-30 min</div>
                </div>
                <button
                  onClick={onToggleAIAgent}
                  className={`w-14 h-7 rounded-full border transition-all relative shrink-0 ${
                    aiAgentActive ? 'bg-brand/30 border-brand/50' : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full absolute top-1 transition-all duration-300 ${
                    aiAgentActive ? 'left-[30px] bg-brand shadow-[0_0_8px_var(--color-brand)]' : 'left-1 bg-muted/50'
                  }`} />
                </button>
              </div>
              {aiAgentActive && onTriggerAICycle && (
                <button
                  onClick={onTriggerAICycle}
                  className="mt-3 w-full py-2 text-[9px] font-heading font-black uppercase tracking-widest bg-brand/10 border border-brand/30 text-brand hover:bg-brand/20 rounded-sm transition-all"
                >
                  🔄 RUN MANUAL AI CYCLE NOW
                </button>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="p-4 bg-black/30 border border-line rounded-sm">
            <div className="text-xs font-heading font-black text-white uppercase tracking-wider mb-2">Agent Stats</div>
            <div className="text-[10px] font-mono text-muted space-y-1">
              <div>Achievements: <span className="text-white font-bold">{badges.length}/{ACHIEVEMENTS.length}</span></div>
              <div>Session: <span className="text-white font-bold">Terminal Active</span></div>
            </div>
          </div>

          <Button onClick={onClose} className="w-full !py-3 text-[10px] tracking-widest font-heading font-black">
            CLOSE CONFIG
          </Button>
        </div>
      </div>
    </div>
  );
};
