import type { Metadata } from 'next';
import './globals.css';
import { site } from '@/lib/site';

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
  openGraph: { siteName: site.name, type: 'website', locale: 'en_US', images: [site.logo] },
  icons: { icon: site.logo },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
