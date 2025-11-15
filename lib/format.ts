export function formatInr(value: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

export function formatPct(value: number): string {
  if (!isFinite(value)) return '?';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function toISTDateString(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function at16IST(date: Date): Date {
  const d = new Date(date);
  const istOffsetMin = 330; // +05:30 => 330 minutes
  // Convert to IST clock
  const utcMinutes = d.getUTCFullYear() * 525600 + (d.getUTCMonth()) * 43200 + (d.getUTCDate()) * 1440 + d.getUTCHours() * 60 + d.getUTCMinutes();
  // This is clumsy; instead set by components in IST
  const utcMs = d.getTime();
  const istMs = utcMs + istOffsetMin * 60 * 1000;
  const ist = new Date(istMs);
  ist.setHours(16, 0, 0, 0);
  const backUtcMs = ist.getTime() - istOffsetMin * 60 * 1000;
  return new Date(backUtcMs);
}
