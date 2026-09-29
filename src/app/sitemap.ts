import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

const marketing = ['', '/about', '/mission', '/services', '/careers', '/contact', '/contact/testimonials'];
const legalPages = ['/privacy', '/notice-of-privacy-practices', '/nondiscrimination', '/accessibility', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...marketing.map((p) => ({
      url: `${site.url}${p}`,
      lastModified: new Date(),
      changeFrequency: (p === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: p === '' ? 1 : p === '/contact' || p === '/careers' ? 0.9 : 0.7,
    })),
    ...legalPages.map((p) => ({
      url: `${site.url}${p}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];
}
