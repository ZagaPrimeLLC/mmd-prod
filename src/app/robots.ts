import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

// Private areas are closed to every crawler.
const PRIVATE = ['/dashboard', '/login', '/design-preview', '/auth', '/welcome', '/api'];

// Decision (2026-09-30): AI assistants and AI search may read the public pages.
// Families and job seekers increasingly ask an assistant before they search, and
// everything public here is meant to be found. Revisit if MMD decides otherwise.
const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: PRIVATE },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
