import { at16IST } from "@/lib/format";

async function fetchCoinbaseTickerUSD(): Promise<number> {
  const res = await fetch('https://api.exchange.coinbase.com/products/LTC-USD/ticker', { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`Coinbase ticker failed: ${res.status}`);
  const json = await res.json() as any;
  const price = parseFloat(json?.price);
  if (!isFinite(price)) throw new Error('Invalid Coinbase price');
  return price;
}

async function fetchUSDINRLatest(): Promise<number> {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR', { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FX latest failed: ${res.status}`);
  const json = await res.json() as any;
  const rate = json?.rates?.INR;
  if (!isFinite(rate)) throw new Error('Invalid FX rate');
  return rate;
}

async function fetchUSDINROn(date: Date): Promise<number> {
  const yyyy = date.toISOString().slice(0, 10);
  const res = await fetch(`https://api.frankfurter.app/${yyyy}?from=USD&to=INR`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`FX historical failed: ${res.status}`);
  const json = await res.json() as any;
  const rate = json?.rates?.INR;
  if (!isFinite(rate)) throw new Error('Invalid FX rate historical');
  return rate;
}

async function fetchCoinbaseCandleCloseAt(targetUtcMs: number): Promise<number | null> {
  // Use 15-minute granularity and request a 2-hour window around target
  const start = new Date(targetUtcMs - 60 * 60 * 1000);
  const end = new Date(targetUtcMs + 60 * 60 * 1000);
  const params = new URLSearchParams({
    granularity: String(900),
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const url = `https://api.exchange.coinbase.com/products/LTC-USD/candles?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return null;
  const arr = await res.json() as Array<[number, number, number, number, number, number]> | any;
  if (!Array.isArray(arr)) return null;
  // Coinbase candles: [ time, low, high, open, close, volume ] with time in seconds
  const targetSec = Math.floor(targetUtcMs / 1000 / 900) * 900; // align to 15-min
  let best: { diff: number; close: number } | null = null;
  for (const c of arr) {
    const t = c[0];
    const close = Number(c[4]);
    const diff = Math.abs(t - targetSec);
    if (!isFinite(close)) continue;
    if (best === null || diff < best.diff) best = { diff, close };
  }
  return best?.close ?? null;
}

export async function fetchCurrentLTCInINR(): Promise<number> {
  // Primary: Coinbase USD * FX
  try {
    const [usd, inr] = await Promise.all([fetchCoinbaseTickerUSD(), fetchUSDINRLatest()]);
    return usd * inr;
  } catch {
    // Fallback: WazirX direct INR last price
    try {
      const res = await fetch('https://api.wazirx.com/api/v2/tickers/ltcinr', { next: { revalidate: 0 } });
      if (!res.ok) throw new Error('WazirX fail');
      const json = await res.json() as any;
      const last = Number(json?.ticker?.last);
      if (!isFinite(last)) throw new Error('Invalid WazirX price');
      return last;
    } catch (e) {
      throw new Error('All price sources failed');
    }
  }
}

export async function fetchHistoricalLTCInINRAt16IST(days: number): Promise<{ date: Date; priceInr: number }[]> {
  const results: { date: Date; priceInr: number }[] = [];
  for (let i = 1; i <= days; i++) {
    const target = at16IST(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    const usdClose = await fetchCoinbaseCandleCloseAt(target.getTime());
    if (usdClose == null) continue;
    let fx: number;
    try {
      fx = await fetchUSDINROn(target);
    } catch {
      fx = await fetchUSDINRLatest();
    }
    results.push({ date: target, priceInr: usdClose * fx });
  }
  return results;
}
