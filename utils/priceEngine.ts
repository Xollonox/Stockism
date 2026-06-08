// Live price simulation engine
// Fluctuates character prices with realistic random walk + mean reversion

const TICK_INTERVAL = 30000; // 30 seconds between ticks
const VOLATILITY_BASE = 0.03; // 3% base volatility
const MEAN_REVERSION = 0.005; // pull toward original price

type PriceTick = {
  charId: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  changePct: number;
};

type TickSubscriber = (ticks: PriceTick[]) => void;

class PriceEngine {
  private chars: Map<string, { price: number; basePrice: number; volatility: number }> = new Map();
  private subscribers: Set<TickSubscriber> = new Set();
  private interval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  init(characters: { id: string; price: number; volatility?: number }[]) {
    for (const c of characters) {
      if (!this.chars.has(c.id)) {
        this.chars.set(c.id, {
          price: c.price,
          basePrice: c.price,
          volatility: c.volatility || VOLATILITY_BASE,
        });
      }
    }
    // Remove chars that no longer exist
    for (const id of this.chars.keys()) {
      if (!characters.find(c => c.id === id)) this.chars.delete(id);
    }
  }

  updatePrice(charId: string, price: number) {
    const c = this.chars.get(charId);
    if (c) {
      c.price = price;
      c.basePrice = price;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.interval = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  stop() {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  subscribe(fn: TickSubscriber) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  private tick() {
    const ticks: PriceTick[] = [];

    for (const [charId, data] of this.chars) {
      // Random walk with mean reversion
      const drift = (data.basePrice - data.price) * MEAN_REVERSION;
      const noise = (Math.random() - 0.5) * 2 * data.volatility * data.price;
      const change = drift + noise;
      const newPrice = Math.max(1, Math.round(data.price + change));

      if (newPrice !== data.price) {
        ticks.push({
          charId,
          oldPrice: data.price,
          newPrice,
          change: newPrice - data.price,
          changePct: ((newPrice - data.price) / data.price) * 100,
        });
        data.price = newPrice;
      }
    }

    if (ticks.length > 0) {
      this.subscribers.forEach(fn => fn(ticks));
    }
  }

  getPrice(charId: string): number {
    return this.chars.get(charId)?.price ?? 0;
  }
}

export const priceEngine = new PriceEngine();
export { TICK_INTERVAL, VOLATILITY_BASE };
export type { PriceTick };
