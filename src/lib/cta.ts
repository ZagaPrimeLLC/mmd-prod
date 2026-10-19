import { COUNTY_SLUGS, SERVICE_SLUGS } from '@/lib/slugs';

/** Buttons and links that send people to the contact page, by their ?cta= value. */
export const PAGE_CTAS = ['header', 'mobile-header', 'footer', 'home-hero', 'home-community', 'cta-film', 'share-experience'] as const;

const ALLOWED = new Set<string>([
  ...PAGE_CTAS,
  ...SERVICE_SLUGS.map((s) => `service-${s}`),
  ...COUNTY_SLUGS.flatMap((c) => [`areas-${c}`, `map-${c}`]),
]);

/**
 * The ?cta= value from a query string, only if it is one the site itself uses.
 * Anything else (including personal details pasted into a URL) is dropped.
 * Both lead forms use this, so bookings and inquiries record CTAs the same way.
 */
export function parseCta(value: unknown): string | null {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : null;
  return v && ALLOWED.has(v) ? v : null;
}

export function ctaFromSearch(search: string): string | null {
  return parseCta(new URLSearchParams(search).get('cta'));
}

/** Older bookings stored their CTA only in attribution. Apply the same allowlist. */
export function storedLeadCta(cta: unknown, attribution: unknown): string | null {
  const legacy = attribution && typeof attribution === 'object' && 'cta' in attribution ? attribution.cta : null;
  return parseCta(cta) ?? parseCta(legacy);
}
