import type { Metadata } from 'next';
import { Work_Sans, Public_Sans } from 'next/font/google';
import './globals.css';
import { site } from '@/lib/site';
import { socialImage } from '@/lib/seo-metadata';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} | ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  robots: { index: true, follow: true },
  keywords: [
    'NJ DDD approved provider', 'developmental disabilities New Jersey',
    'respite care NJ', 'individual support NJ', 'community support NJ',
    'Direct Support Professional jobs NJ', 'special needs care New Jersey',
    'adult disability services South Plainfield',
  ],
  openGraph: { siteName: site.name, type: 'website', locale: 'en_US', images: [socialImage] },
  twitter: { card: 'summary_large_image', images: [socialImage] },
  icons: { icon: site.logo },
};

// Self-hosted at build time, so no request goes to Google and the CSP stays 'self'.
// Work Sans carries the public site (light for display, regular for text); Public Sans stays for the CRM.
const display = Work_Sans({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-display', display: 'swap' });
const sans = Public_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
