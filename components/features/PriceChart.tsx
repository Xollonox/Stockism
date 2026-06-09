import React from 'react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface CandlestickChartProps {
  data: Candle[];
  width?: number;
  height?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, width = 340, height = 180 }) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center text-muted/40 font-mono text-[10px]" style={{ width, height }}>
        Not enough data
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 25, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allPrices = data.flatMap(d => [d.high, d.low]);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min || 1;

  const toX = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const toY = (price: number) => padding.top + chartH - ((price - min) / range) * chartH;

  // Volume bar height
  const maxVol = Math.max(...data.map(d => d.volume || 0), 1);
  const volHeight = 20;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="candle-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="candle-bg-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const y = padding.top + chartH * (1 - pct);
        return (
          <g key={pct}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <text x={padding.left - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.15)" fontSize="8" fontFamily="monospace">
              {Math.round(min + range * pct)}
            </text>
          </g>
        );
      })}

      {/* Candles */}
      {data.map((d, i) => {
        const x = toX(i) - 3;
        const candleWidth = Math.max(3, chartW / data.length * 0.6);
        const isUp = d.close >= d.open;
        const color = isUp ? '#10B981' : '#EF4444';
        const alpha = isUp ? '0.7' : '0.7';

        return (
          <g key={i}>
            {/* Wick */}
            <line x1={toX(i)} y1={toY(d.high)} x2={toX(i)} y2={toY(d.low)} stroke={color} strokeWidth="1" opacity={alpha} />
            {/* Body */}
            <rect
              x={toX(i) - candleWidth / 2}
              y={toY(Math.max(d.open, d.close))}
              width={candleWidth}
              height={Math.max(1, Math.abs(toY(d.open) - toY(d.close)))}
              fill={color}
              opacity={alpha}
              rx="1"
            />
            {/* Volume bar */}
            {d.volume && (
              <rect
                x={toX(i) - candleWidth / 2}
                y={height - volHeight * (d.volume / maxVol)}
                width={candleWidth}
                height={volHeight * (d.volume / maxVol)}
                fill={isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}
                rx="1"
              />
            )}
          </g>
        );
      })}

      {/* Last price label */}
      {data.length > 0 && (
        <text x={width - padding.right} y={padding.top - 4} textAnchor="end" fill="#E11D48" fontSize="10" fontFamily="monospace" fontWeight="bold">
          Φ{Math.round(data[data.length - 1].close).toLocaleString()}
        </text>
      )}
    </svg>
  );
};

// Helper to create candles from price history
export function pricesToCandles(prices: { time: number; price: number }[]): Candle[] {
  if (!prices || prices.length < 2) return [];
  
  // Group into hourly candles
  const groups: Record<number, number[]> = {};
  for (const p of prices) {
    const hour = Math.floor(p.time / 3600000) * 3600000;
    if (!groups[hour]) groups[hour] = [];
    groups[hour].push(p.price);
  }

  return Object.entries(groups).map(([time, prices]) => ({
    time: parseInt(time),
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    volume: prices.length * 1000,
  }));
}
