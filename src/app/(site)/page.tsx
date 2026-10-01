import type { Metadata } from 'next';
import HeroSection from '@/components/site/HeroSection';
import TrustBadges from '@/components/site/TrustBadges';
import ValuesSection from '@/components/site/ValuesSection';
import StatsBand from '@/components/site/StatsBand';
import CareersBand from '@/components/site/CareersBand';
import CTABanner from '@/components/site/CTABanner';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: `${site.name} | ${site.tagline}`,
  description: site.description,
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  // A home and community based service provider. LocalBusiness is the honest
  // fit; MedicalBusiness would overstate it, HomeAndConstructionBusiness is for contractors.
  '@type': 'LocalBusiness',
  '@id': `${site.url}/#organization`,
  name: site.legalName,
  alternateName: site.name,
  url: site.url,
  logo: `${site.url}${site.logo}`,
  image: `${site.url}/images/home-hero.jpg`,
  slogan: site.slogan,
  description: site.description,
  telephone: site.phone,
  email: site.email,
  areaServed: { '@type': 'State', name: 'New Jersey' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: 'US',
  },
  knowsAbout: ['Individual Support', 'Respite Care', 'Community Based Supports', 'NJ Division of Developmental Disabilities'],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <HeroSection />
      <TrustBadges />
      <ValuesSection />
      <StatsBand />
      <CareersBand />
      <CTABanner />
    </>
  );
}
