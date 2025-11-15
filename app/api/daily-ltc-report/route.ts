import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentLTCInINR, fetchLTCMarketChartINR, nearestPriceAtTimestamp } from '@/lib/coingecko';
import { at16IST } from '@/lib/format';
import { sendEmail } from '@/lib/email';
import { renderDailyEmailHtml } from '@/emails/dailyReport';

const RECIPIENT = process.env.EMAIL_TO || 'sweyjotdhillon@gmail.com';

function getIST16DateForNDaysAgo(n: number): Date {
  const now = new Date();
  const day = new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
  return at16IST(day);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch today's price at runtime
    const todayPrice = await fetchCurrentLTCInINR();

    // Fetch historical hourly prices and map to 16:00 IST for each prior day
    const chart = await fetchLTCMarketChartINR(8);

    const todayAt16 = getIST16DateForNDaysAgo(0);
    const todayValue2000 = todayPrice * 2000;

    const history: { date: Date; priceInr: number; valueFor2000: number; dayOverDayPct?: number }[] = [];

    for (let i = 1; i <= 7; i++) {
      const dt = getIST16DateForNDaysAgo(i);
      const price = nearestPriceAtTimestamp(chart.prices, dt.getTime(), 120) ?? null;
      if (price == null) continue;
      history.push({ date: dt, priceInr: price, valueFor2000: price * 2000 });
    }

    // compute DoD for rows including today vs yesterday
    if (history.length > 0) {
      const yesterday = history[0];
      const dayOverDay = ((todayPrice - yesterday.priceInr) / yesterday.priceInr) * 100;
      // add DoD for prior days
      for (let i = 0; i < history.length - 1; i++) {
        const current = history[i];
        const prev = history[i + 1];
        current.dayOverDayPct = ((current.priceInr - prev.priceInr) / prev.priceInr) * 100;
      }
      const html = renderDailyEmailHtml({
        today: { date: todayAt16, priceInr: todayPrice, valueFor2000: todayValue2000, dayOverDayPct: dayOverDay },
        history,
      });

      const subject = `LTC 16:00 IST: ?${Math.round(todayPrice).toLocaleString('en-IN')} | x2000: ?${Math.round(todayValue2000).toLocaleString('en-IN')}`;

      await sendEmail({ to: RECIPIENT, subject, html });
    } else {
      const html = renderDailyEmailHtml({
        today: { date: todayAt16, priceInr: todayPrice, valueFor2000: todayValue2000 },
        history: [],
      });
      const subject = `LTC 16:00 IST: ?${Math.round(todayPrice).toLocaleString('en-IN')} | x2000: ?${Math.round(todayValue2000).toLocaleString('en-IN')}`;
      await sendEmail({ to: RECIPIENT, subject, html });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
