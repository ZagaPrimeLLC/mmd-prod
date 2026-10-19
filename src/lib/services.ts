import type { ServiceSlug } from '@/lib/slugs';

/** Public names, program grouping and historic inquiry values stay together. */
export const SERVICE_CATALOG: { slug: ServiceSlug; inquiryValue: string; name: string; program: 'ddd' | 'home-care'; summary: string }[] = [
  { slug: 'home-health-aide', inquiryValue: 'home-health-aide', name: 'Home Health Aide Services', program: 'home-care', summary: 'Personal care, companionship and help with everyday routines for adults and seniors at home.' },
  { slug: 'community-based-supports', inquiryValue: 'community-support', name: 'Community-Based Supports', program: 'ddd', summary: 'Support to take part in community life and build everyday independence.' },
  { slug: 'individual-supports', inquiryValue: 'individual-support', name: 'Individual Supports', program: 'ddd', summary: 'One-to-one support with daily living and goals in the Individualized Service Plan.' },
  { slug: 'respite', inquiryValue: 'respite-care', name: 'Respite', program: 'ddd', summary: 'Planned relief for family caregivers of adults with developmental disabilities.' },
];

export function serviceFromValue(value: unknown) {
  return typeof value === 'string' ? SERVICE_CATALOG.find(s => s.slug === value || s.inquiryValue === value) : undefined;
}

export function serviceFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const direct = serviceFromValue(params.get('service'));
  const cta = params.get('cta');
  return direct ?? (cta?.startsWith('service-') ? serviceFromValue(cta.slice(8)) : undefined);
}

export function serviceLabel(value: unknown): string | null {
  if (value === 'other') return 'Something else';
  if (value === 'dsp-application') return 'DSP application';
  return serviceFromValue(value)?.name ?? null;
}

/** Canonical column value; an undecided visitor stays null. */
export function bookingServiceValue(value: unknown): ServiceSlug | 'other' | null {
  return value === 'other' ? 'other' : serviceFromValue(value)?.slug ?? null;
}

export const HOME_CARE_HREF = '/services/home-health-aide';
export const HOME_CARE_CONTACT = '/contact?service=home-health-aide&cta=service-home-health-aide';
