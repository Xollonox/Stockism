import React from 'react';

interface PriceChartProps {
  prices: { time: number; price: number }[];
  width?: number;
  height?: number;
  color?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ prices, width = 280, height = 100, color = '#E11D48' }) => {
  if (!prices || prices.length < 2) {
    return (
      <div className="flex items-center justify-center text-muted/40 font-mono text-[10px]" style={{ width, height }}>
        Insufficient data
      </div>
    );
  }

  const vals = prices.map(p => p.price);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const isUp = vals[vals.length - 1] >= vals[0];

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p.price - min) / range) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Gradient */}
      <defs>
        <linearGradient id={`chart-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      
      {/* Fill area */}
      <polygon points={fillPoints} fill={`url(#chart-grad-${color})`} />
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#10B981' : '#EF4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]"
      />
      
      {/* End dot */}
      <circle
        cx={width}
        cy={vals[vals.length - 1] === max ? 10 : height - ((vals[vals.length - 1] - min) / range) * (height - 20) - 10}
        r="2.5"
        fill={isUp ? '#10B981' : '#EF4444'}
        className="drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]"
      />
    </svg>
  );
};
