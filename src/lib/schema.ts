import { SERVICE_CATALOG } from '@/lib/services';
import { HOME_CARE } from '@/lib/home-care';
import { site } from '@/lib/site';
import { NJ_COUNTIES } from '@/lib/nj-counties';
import { type DddService } from '@/lib/seo-content';

/**
 * Structured data shared across the site. Every page points at the same
 * organization @id, so Google reads one business, not several.
 */
export const ORG_ID = `${site.url}/#organization`;

/** Profiles that are verifiably MMD's. Add the Google Business Profile link once it is public. */
export const SAME_AS = ['https://www.linkedin.com/in/mmd-community-care-7b34a4263/'];

const address = {
  '@type': 'PostalAddress',
  streetAddress: site.address.street,
  addressLocality: site.address.city,
  addressRegion: site.address.state,
  postalCode: site.address.zip,
  addressCountry: 'US',
};

export const counties = NJ_COUNTIES.map((c) => ({ '@type': 'AdministrativeArea', name: `${c.name} County, New Jersey` }));

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    // A home and community based service provider. LocalBusiness is the honest
    // fit; MedicalBusiness would overstate it.
    '@type': 'LocalBusiness',
    '@id': ORG_ID,
    name: site.legalName,
    alternateName: site.name,
    url: site.url,
    logo: `${site.url}${site.logo}`,
    image: `${site.url}/img/kitchen.jpg`,
    slogan: site.slogan,
    description: site.description,
    telephone: '+1-732-801-7683',
    email: site.email,
    address,
    areaServed: counties,
    sameAs: SAME_AS,
    hasMap: site.mapsUrl,
    knowsAbout: ['NJ Division of Developmental Disabilities', 'Intellectual and developmental disabilities', ...SERVICE_CATALOG.map((s) => s.name)],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Home care and developmental disability services',
      itemListElement: SERVICE_CATALOG.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: `${site.url}/services/${s.slug}` },
      })),
    },
  };
}

export function serviceLd(s: DddService, area?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: area ? `${s.name} in ${area} County, NJ` : s.name,
    alternateName: s.aka,
    serviceType: s.name,
    description: s.metaDescription,
    url: `${site.url}/services/${s.slug}`,
    provider: { '@id': ORG_ID, '@type': 'LocalBusiness', name: site.legalName },
    areaServed: area ? { '@type': 'AdministrativeArea', name: `${area} County, New Jersey` } : counties,
    audience: { '@type': 'PeopleAudience', audienceType: 'Adults (21+) with intellectual and developmental disabilities, and their families' },
  };
}

export function homeCareServiceLd() {
  return {
    '@context': 'https://schema.org', '@type': 'Service', name: HOME_CARE.name, serviceType: 'Home Health Aide Services',
    description: HOME_CARE.description, url: `${site.url}/services/home-health-aide`,
    provider: { '@id': ORG_ID, '@type': 'LocalBusiness', name: site.legalName },
    // Specific home-care coverage is confirmed by town; do not imply statewide availability.
    audience: { '@type': 'PeopleAudience', audienceType: 'Adults and seniors seeking personal care and everyday support at home' },
  };
}
