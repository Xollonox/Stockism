import React from 'react';

// ─── ANIMATED BACKGROUND ───────────────────────────────────
export const AnimatedBg: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
    <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:28px_28px]" />
    <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-brand/5 blur-[120px] animate-pulse-slow" />
    <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] rounded-full bg-[#00F0FF]/5 blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand/3 blur-[150px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
  </div>
);

// ─── ANIMATED GRADIENT BAR ─────────────────────────────────
export const GradientBar: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-[2px] w-full bg-gradient-to-r from-transparent via-brand to-transparent bg-[length:200%_100%] animate-shimmer ${className}`} />
);

// ─── PREMIUM DIVIDER ────────────────────────────────────────
export const GlassDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`glass-divider my-4 ${className}`} />
);

// ─── GLOW DOT ───────────────────────────────────────────────
export const GlowDot: React.FC<{ color?: string; pulse?: boolean; className?: string }> = ({ color = 'var(--color-brand)', pulse = true, className = '' }) => (
  <span className={`relative flex w-2.5 h-2.5 ${className}`}>
    {pulse && <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.5 }} />}
    <span className="relative rounded-full w-2.5 h-2.5" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
  </span>
);

// ─── STATUS BADGE ──────────────────────────────────────────
type BadgeStatus = 'online' | 'offline' | 'warning' | 'active' | 'locked';

export const StatusBadge: React.FC<{ status: BadgeStatus; label: string; className?: string }> = ({ status, label, className = '' }) => {
  const colors = {
    online: { bg: 'bg-good/10', border: 'border-good/25', text: 'text-good', dot: '#10B981' },
    offline: { bg: 'bg-bad/10', border: 'border-bad/25', text: 'text-bad', dot: '#EF4444' },
    warning: { bg: 'bg-warn/10', border: 'border-warn/25', text: 'text-warn', dot: '#F59E0B' },
    active: { bg: 'bg-brand/10', border: 'border-brand/25', text: 'text-brand', dot: '#E11D48' },
    locked: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-muted', dot: '#9CA3AF' },
  };
  const c = colors[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded-sm border ${c.bg} ${c.border} ${c.text} ${className}`}>
      <GlowDot color={c.dot} pulse={status !== 'locked'} className="!w-1.5 !h-1.5" />
      {label}
    </span>
  );
};

// ─── STAT CARD ──────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string;
  value: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}> = ({ label, value, icon, trend, className = '' }) => (
  <div className={`premium-card p-4 rounded-lg relative overflow-hidden group ${className}`}>
    <div className="laser-sweep" />
    {icon && <span className="text-lg mb-1 block opacity-40">{icon}</span>}
    <div className="text-[8px] font-heading font-black text-muted/50 uppercase tracking-widest mb-1">{label}</div>
    <div className="flex items-center gap-2">
      <span className="text-xl font-mono font-black text-white tracking-tight">{value}</span>
      {trend === 'up' && <span className="text-[10px] text-good font-bold animate-float">▲</span>}
      {trend === 'down' && <span className="text-[10px] text-bad font-bold">▼</span>}
    </div>
  </div>
);

// ─── SECTION HEADER ─────────────────────────────────────────
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={`flex items-center justify-between gap-4 mb-6 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="w-1 h-6 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand)]" />
      <div>
        <h2 className="text-lg font-heading font-black text-white uppercase tracking-tighter">{title}</h2>
        {subtitle && <p className="text-[9px] font-mono text-muted/50 tracking-widest uppercase">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// ─── GLOWING BORDER WRAPPER ────────────────────────────────
export const GlowBorder: React.FC<{
  children: React.ReactNode;
  color?: string;
  className?: string;
  active?: boolean;
}> = ({ children, color = 'var(--color-brand)', active = true, className = '' }) => (
  <div className={`relative group ${className}`}>
    <div
      className={`absolute inset-0 rounded-lg transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}15, transparent 40%)`,
      }}
    />
    <div className="relative">{children}</div>
  </div>
);

// ─── PREMIUM SKELETON ───────────────────────────────────────
export const PremiumSkeleton: React.FC<{ className?: string; lines?: number }> = ({ className = '', lines = 3 }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded bg-[length:200%_100%] animate-shimmer"
        style={{ width: `${70 + Math.random() * 30}%` }}
      />
    ))}
  </div>
);

// ─── DATA TICKER (Single Line) ─────────────────────────────
export const TickerLine: React.FC<{
  items: { label: string; value: string; color?: string }[];
  className?: string;
}> = ({ items, className = '' }) => (
  <div className={`ticker-wrap ${className}`}>
    <div className="ticker-content flex items-center gap-10">
      {[...items, ...items].map((item, i) => (
        <span key={i} className="text-[10px] font-mono text-muted/60 whitespace-nowrap">
          {item.label}: <span className="text-white font-bold" style={item.color ? { color: item.color } : {}}>{item.value}</span>
        </span>
      ))}
    </div>
  </div>
);

// ─── KEYBOARD HINT ──────────────────────────────────────────
export const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[8px] font-mono text-muted/60">
    {children}
  </kbd>
);

// ─── TOOLTIP ────────────────────────────────────────────────
export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-black/90 backdrop-blur-md border border-white/10 rounded text-[9px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45 -mt-1" style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />
    </div>
  </div>
);

// ─── ANIMATED NUMBER ────────────────────────────────────────
export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}> = ({ value, prefix = '', suffix = '', className = '', decimals = 0 }) => {
  const display = value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span className={`font-mono font-black tracking-tight tabular-nums ${className}`}>
      {prefix}{display}{suffix}
    </span>
  );
};

// ─── CORNER DECORATION ─────────────────────────────────────
export const CornerAccent: React.FC<{ position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; className?: string }> = ({ position = 'top-right', className = '' }) => {
  const pos = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };
  return (
    <div className={`absolute ${pos[position]} w-8 h-8 pointer-events-none ${className}`}>
      <div className="absolute w-5 h-[1px] bg-brand/30" style={position.includes('right') ? { right: 0, top: 0 } : { left: 0, top: 0 }} />
      <div className="absolute w-[1px] h-5 bg-brand/30" style={position.includes('bottom') ? { bottom: 0, left: 0 } : { top: 0, left: 0 }} />
    </div>
  );
};

// ─── NEON TEXT ──────────────────────────────────────────────
export const NeonText: React.FC<{ children: React.ReactNode; className?: string; color?: string }> = ({ children, className = '', color = 'var(--color-brand)' }) => (
  <span className={className} style={{ textShadow: `0 0 10px ${color}, 0 0 20px ${color}40, 0 0 40px ${color}20` }}>
    {children}
  </span>
);

// ─── PREMIUM CARD WRAPPER ──────────────────────────────────
export const PremiumCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}> = ({ children, className = '', glow = true, onClick }) => (
  <div
    onClick={onClick}
    className={`premium-card glass-refract corner-cut relative overflow-hidden group transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${glow ? 'hover:border-brand/20' : ''} ${className}`}
  >
    <div className="laser-sweep" />
    {children}
    {glow && (
      <div className="absolute inset-0 bg-gradient-to-t from-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    )}
  </div>
);
