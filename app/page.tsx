export default function HomePage() {
  return (
    <main>
      <h1>Daily LTC Report (INR)</h1>
      <p>This app sends a daily email at 16:00 IST with the Litecoin price in INR, value for 2000 units, and changes vs prior days.</p>
      <p>
        API route: <code>/api/daily-ltc-report</code>
      </p>
      <p style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        Cron is scheduled for 10:30 UTC daily (16:00 IST).
      </p>
    </main>
  );
}
