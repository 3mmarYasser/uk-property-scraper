import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Nav } from '../components/Nav';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: 'Keystone — UK property intelligence',
    template: '%s · Keystone',
  },
  description:
    'Keystone indexes UK property listings, captures every price change, and flags market movement the moment it happens.',
  applicationName: 'Keystone',
  openGraph: {
    title: 'Keystone — UK property intelligence',
    description:
      'Index UK listings, track every price change, and catch market movement in real time.',
    siteName: 'Keystone',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Keystone — UK property intelligence',
    description: 'Index UK listings, track every price change, and catch market movement in real time.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0b0e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <Nav />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
