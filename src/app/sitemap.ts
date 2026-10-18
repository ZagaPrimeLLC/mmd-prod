import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';
import { getOpenJobs } from '@/lib/public-jobs';
import { DDD_SERVICES, AREAS } from '@/lib/seo-content';

const marketing = [
  '', '/services', ...DDD_SERVICES.map((s) => `/services/${s.slug}`), '/getting-started',
  '/areas', ...AREAS.map((a) => `/areas/${a.slug}`),
  '/about', '/mission', '/careers', '/contact', '/contact/testimonials',
];
const legalPages = ['/privacy', '/notice-of-privacy-practices', '/nondiscrimination', '/accessibility', '/terms'];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getOpenJobs();
  return [
    ...marketing.map((p) => ({
      url: `${site.url}${p}`,
      changeFrequency: (p === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
      priority: p === '' ? 1 : p === '/contact' || p === '/careers' ? 0.9 : 0.7,
    })),
    ...legalPages.map((p) => ({
      url: `${site.url}${p}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
    ...jobs.map((j) => ({
      url: `${site.url}/careers/${j.slug}`,
      lastModified: new Date(j.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
