type MarketChart = { prices: [number, number][] };

export async function fetchCurrentLTCInINR(): Promise<number> {
  const url = 'https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=inr';
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Failed fetching current price: ${res.status}`);
  const json = (await res.json()) as any;
  const price = json?.litecoin?.inr;
  if (typeof price !== 'number') throw new Error('Invalid price data');
  return price;
}

export async function fetchLTCMarketChartINR(days: number): Promise<MarketChart> {
  const url = `https://api.coingecko.com/api/v3/coins/litecoin/market_chart?vs_currency=inr&days=${days}&interval=hourly`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Failed fetching market chart: ${res.status}`);
  return (await res.json()) as MarketChart;
}

export function nearestPriceAtTimestamp(prices: [number, number][], targetMs: number, toleranceMinutes = 90): number | null {
  const toleranceMs = toleranceMinutes * 60 * 1000;
  let best: { dt: number; price: number; diff: number } | null = null;
  for (const [ts, price] of prices) {
    const diff = Math.abs(ts - targetMs);
    if (diff <= toleranceMs && (best === null || diff < best.diff)) {
      best = { dt: ts, price, diff };
    }
  }
  return best?.price ?? null;
}
