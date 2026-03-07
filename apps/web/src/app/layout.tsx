import type { Metadata } from 'next';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'JusTenant — Where Tenants Come First',
  description: 'Multi-tenant real estate and property management platform for CMTs, landlords, and tenants',
  icons: {
    icon: '/logos/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/favicon.ico" type="image/x-icon" />
        <meta name="theme-color" content="#2DB5DA" />
      </head>
      <body className="font-proxima-nova antialiased">{children}</body>
    </html>
  );
}
