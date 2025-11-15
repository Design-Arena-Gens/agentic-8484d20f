import { NextRequest, NextResponse } from 'next/server';
import { fetchCurrentLTCInINR, fetchHistoricalLTCInINRAt16IST } from '@/lib/pricing';
import { at16IST, formatInr } from '@/lib/format';
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

    const todayPrice = await fetchCurrentLTCInINR();
    const todayAt16 = getIST16DateForNDaysAgo(0);
    const todayValue2000 = todayPrice * 2000;

    const historical = await fetchHistoricalLTCInINRAt16IST(7);

    const history: { date: Date; priceInr: number; valueFor2000: number; dayOverDayPct?: number }[] = historical.map(h => ({
      date: h.date,
      priceInr: h.priceInr,
      valueFor2000: h.priceInr * 2000,
    }));

    if (history.length > 0) {
      const yesterday = history[0];
      const dayOverDay = ((todayPrice - yesterday.priceInr) / yesterday.priceInr) * 100;
      for (let i = 0; i < history.length - 1; i++) {
        const current = history[i];
        const prev = history[i + 1];
        current.dayOverDayPct = ((current.priceInr - prev.priceInr) / prev.priceInr) * 100;
      }
      const html = renderDailyEmailHtml({
        today: { date: todayAt16, priceInr: todayPrice, valueFor2000: todayValue2000, dayOverDayPct: dayOverDay },
        history,
      });
      const subject = `LTC 16:00 IST: ${formatInr(todayPrice)} | x2000: ${formatInr(todayValue2000)}`;
      await sendEmail({ to: RECIPIENT, subject, html });
    } else {
      const html = renderDailyEmailHtml({
        today: { date: todayAt16, priceInr: todayPrice, valueFor2000: todayValue2000 },
        history: [],
      });
      const subject = `LTC 16:00 IST: ${formatInr(todayPrice)} | x2000: ${formatInr(todayValue2000)}`;
      await sendEmail({ to: RECIPIENT, subject, html });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
