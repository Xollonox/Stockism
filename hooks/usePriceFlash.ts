import { useEffect, useRef, useState } from 'react';

// Track price changes and return flash direction
export function usePriceFlash(price: number) {
  const prevPrice = useRef(price);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (prevPrice.current !== price && prevPrice.current !== 0) {
      const dir = price > prevPrice.current ? 'up' : 'down';
      setFlash(dir);
      const t = setTimeout(() => setFlash(null), 400);
      prevPrice.current = price;
      return () => clearTimeout(t);
    }
    prevPrice.current = price;
  }, [price]);

  return flash;
}
