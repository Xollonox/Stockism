import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface TutorialProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

interface TutorialStep {
  title: string;
  description: string;
  highlight?: string;
  position: 'center' | 'top' | 'bottom';
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome, Agent',
    description: 'Welcome to STOCKISM — the elite Lookism trading terminal. You\'ve been granted Φ 5,000 in starting capital. Use it wisely.',
    position: 'center',
  },
  {
    title: 'The Exchange',
    description: 'This is the Main Exchange. Browse fighter assets, check prices, and find your next investment. Use the search bar to filter by name or crew.',
    position: 'center',
  },
  {
    title: 'Execute a Trade',
    description: 'Click on any character card to view their profile, price chart, and stats. Then hit BUY or SELL to execute a trade.',
    position: 'center',
  },
  {
    title: 'Your Portfolio',
    description: 'Track your holdings, net worth, and trade history in the Portfolio view. Watch your valuation grow as you make smart moves.',
    position: 'center',
  },
  {
    title: 'Compete & Dominate',
    description: 'Climb the leaderboard, earn achievements, complete daily missions, and establish yourself as the top agent in the underground economy.',
    position: 'center',
  },
];

export const Tutorial: React.FC<TutorialProps> = ({ step, onNext, onSkip, onFinish }) => {
  const currentStep = STEPS[step] || STEPS[0];
  const [typedTitle, setTypedTitle] = useState('');
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    setTypedTitle('');
    setShowContent(false);
    const t1 = setTimeout(() => {
      let i = 0;
      const title = currentStep.title;
      const interval = setInterval(() => {
        setTypedTitle(title.slice(0, i + 1));
        i++;
        if (i >= title.length) {
          clearInterval(interval);
          setTimeout(() => setShowContent(true), 200);
        }
      }, 30);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(t1);
  }, [step, currentStep.title]);

  const isLast = step >= STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      {/* Scanlines overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg glass-panel border border-line rounded-md p-8 animate-zoom-in">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i === step ? 'bg-brand shadow-[0_0_6px_var(--color-brand)]' :
                i < step ? 'bg-brand/50' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Title with typing effect */}
        <h2 className="font-heading text-2xl text-white italic tracking-tighter mb-2">
          {typedTitle}
          <span className="animate-pulse text-brand">▌</span>
        </h2>

        {/* Description */}
        {showContent && (
          <div className="animate-fade-in-up">
            <p className="text-sm text-muted font-body leading-relaxed mb-8">
              {currentStep.description}
            </p>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={onSkip}
                className="text-[9px] font-mono text-muted/50 hover:text-white uppercase tracking-widest transition-colors"
              >
                Skip Tutorial
              </button>
              <div className="flex gap-3">
                {step > 0 && (
                  <Button variant="ghost" onClick={onNext} className="text-[10px] !px-4">
                    ← Back
                  </Button>
                )}
                <Button
                  onClick={isLast ? onFinish : onNext}
                  className="text-[10px] tracking-widest font-heading font-black"
                >
                  {isLast ? 'BEGIN TRADING' : 'NEXT →'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
