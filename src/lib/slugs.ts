/**
 * The identifiers shared by pages, map links and lead attribution. One list
 * each, typed, so a renamed service or a new county link cannot silently fall
 * out of step with the CTA allowlist.
 */
export const DDD_SERVICE_SLUGS = ['community-based-supports', 'individual-supports', 'respite'] as const;
export type DddServiceSlug = (typeof DDD_SERVICE_SLUGS)[number];
export const SERVICE_SLUGS = [...DDD_SERVICE_SLUGS, 'home-health-aide'] as const;
export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export const COUNTY_SLUGS = [
  'atlantic', 'bergen', 'burlington', 'camden', 'cape-may', 'cumberland', 'essex',
  'gloucester', 'hudson', 'hunterdon', 'mercer', 'middlesex', 'monmouth', 'morris',
  'ocean', 'passaic', 'salem', 'somerset', 'sussex', 'union', 'warren',
] as const;
export type CountySlug = (typeof COUNTY_SLUGS)[number];
