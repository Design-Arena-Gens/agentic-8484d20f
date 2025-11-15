export const metadata = {
  title: "Daily LTC INR Reports",
  description: "Automated 16:00 IST Litecoin reports",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
