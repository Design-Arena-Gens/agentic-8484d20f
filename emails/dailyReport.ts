import { formatInr, formatPct, toISTDateString } from "@/lib/format";

type Row = {
  date: Date;
  priceInr: number;
  valueFor2000: number;
  dayOverDayPct?: number;
};

export function renderDailyEmailHtml(params: {
  today: Row;
  history: Row[]; // previous days, most recent first
}): string {
  const { today, history } = params;
  const average =
    history.length > 0 ? history.reduce((s, r) => s + r.priceInr, 0) / history.length : today.priceInr;
  const vsAvg = ((today.priceInr - average) / average) * 100;

  const rows = [today, ...history];

  const tableRows = rows
    .map((r, idx) => {
      const isToday = idx === 0;
      const dateStr = toISTDateString(r.date) + (isToday ? " (Today)" : "");
      const price = formatInr(r.priceInr);
      const val = formatInr(r.valueFor2000);
      const change = r.dayOverDayPct !== undefined ? formatPct(r.dayOverDayPct) : "?";
      return `<tr style="text-align:right"><td style="text-align:left;padding:8px;border-bottom:1px solid #eee">${dateStr}</td><td style="padding:8px;border-bottom:1px solid #eee">${price}</td><td style=\"padding:8px;border-bottom:1px solid #eee\">${val}</td><td style=\"padding:8px;border-bottom:1px solid #eee\">${change}</td></tr>`;
    })
    .join("");

  const subjectLine = `LTC @ 16:00 IST: ${formatInr(today.priceInr)} | x2000: ${formatInr(today.valueFor2000)}`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subjectLine}</title>
  </head>
  <body style="font-family:Inter,system-ui,Arial,sans-serif;color:#111;line-height:1.5">
    <h2 style="margin-bottom:4px">Daily Litecoin Report (INR)</h2>
    <div style="color:#555;margin-bottom:16px">Run time: 16:00 IST ? Quantity: 2000</div>

    <div style="padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;display:inline-block;margin-bottom:16px">
      <div><strong>Today Price:</strong> ${formatInr(today.priceInr)}</div>
      <div><strong>Value (x2000):</strong> ${formatInr(today.valueFor2000)}</div>
      <div><strong>Vs 7-day average:</strong> ${formatPct(vsAvg)}</div>
    </div>

    <h3 style="margin-top:0.5rem;margin-bottom:0.25rem">Daily snapshot at 16:00 IST</h3>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="text-align:right">
          <th style="text-align:left;padding:8px;border-bottom:2px solid #ddd">Date (IST)</th>
          <th style="padding:8px;border-bottom:2px solid #ddd">LTC Price</th>
          <th style="padding:8px;border-bottom:2px solid #ddd">x2000 Value</th>
          <th style="padding:8px;border-bottom:2px solid #ddd">DoD Change</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <p style="color:#666;font-size:12px;margin-top:16px">Prices sourced from CoinGecko. Times shown in IST. DoD=Day-over-Day.</p>
  </body>
</html>`;
}
