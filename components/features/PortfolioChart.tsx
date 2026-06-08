import React, { useMemo } from 'react';

interface PortfolioChartProps {
  history: { time: number; netWorth: number }[];
  width?: number;
  height?: number;
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({ history, width = 600, height = 200 }) => {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const { points, min, max, isUp } = useMemo(() => {
    if (!history || history.length < 2) return { points: '', min: 0, max: 1, isUp: true };
    const vals = history.map(h => h.netWorth);
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const range = mx - mn || 1;
    const padding = 20;

    const pts = history.map((h, i) => {
      const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((h.netWorth - mn) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    const fillPts = `${padding},${height - padding} ${pts} ${width - padding},${height - padding}`;

    return {
      points: pts,
      fillPoints: fillPts,
      min: mn,
      max: mx,
      isUp: vals[vals.length - 1] >= vals[0],
    };
  }, [history, width, height]);

  if (!history || history.length < 2) {
    return (
      <div className="flex items-center justify-center text-muted/40 font-mono text-[10px]" style={{ width, height }}>
        Insufficient data — start trading to see your portfolio history
      </div>
    );
  }

  const fillPoints = useMemo(() => {
    if (!history || history.length < 2) return '';
    const padding = 20;
    const vals = history.map(h => h.netWorth);
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const range = mx - mn || 1;
    const pts = history.map((h, i) => {
      const x = (i / (history.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((h.netWorth - mn) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');
    return `${padding},${height - padding} ${pts} ${width - padding},${height - padding}`;
  }, [history, width, height]);

  const color = isUp ? '#10B981' : '#EF4444';

  return (
    <div className="relative">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="port-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill="url(#port-grad)" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
        <circle cx={width - 20} cy={height - 20 - ((history[history.length - 1].netWorth - min) / (max - min || 1)) * (height - 40)} r="3" fill={color} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
      </svg>
      {/* Labels */}
      <div className="flex justify-between text-[8px] font-mono text-muted/50 mt-1 px-5">
        <span>{history.length > 0 ? new Date(history[0].time).toLocaleDateString() : ''}</span>
        <span>Now</span>
      </div>
    </div>
  );
};
