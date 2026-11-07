import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GreenPearl | Private Multiplayer & Pass-the-Phone Party Games',
  description:
    'Private, minimal multiplayer and pass-the-phone party games designed for close friends. 100% private, offline-capable, with 2,000+ words across Bollywood, Sports, and Culture.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'GreenPearl | Private Multiplayer Party Games',
    description: 'Private, minimal party games platform for close friends.',
    type: 'website',
    siteName: 'GreenPearl',
  },
  twitter: {
    card: 'summary',
    title: 'GreenPearl | Private Multiplayer Party Games',
    description: 'Private, minimal party games platform for close friends.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0c0d12',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-surface-950 text-slate-100 antialiased selection:bg-accent-green/30 selection:text-white">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
