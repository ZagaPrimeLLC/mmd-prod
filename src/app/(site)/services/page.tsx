import type { Metadata } from 'next';
import { PHOTOS } from '@/lib/photos';
import { Check } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import HomeCareFeature from '@/components/site/HomeCareFeature';
import ServiceRows from '@/components/site/ServiceRows';
import StepsSection from '@/components/site/StepsSection';
import CTABanner from '@/components/site/CTABanner';
import JsonLd from '@/components/site/JsonLd';
import { onboardingChecks } from '@/lib/site';
import { DDD_SERVICES } from '@/lib/seo-content';
import { serviceLd, homeCareServiceLd } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Home Care and DDD Services in New Jersey',
  description:
    'Home Health Aide Services for adults and seniors, alongside NJ DDD Community-Based Supports, Individual Supports and Respite in New Jersey.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={[homeCareServiceLd(), ...DDD_SERVICES.map((s) => serviceLd(s))]} />
      <PageHero
        crumbs={[{ name: 'Services', href: '/services' }]}
        title="Care at home. Support in the community."
        lead="Explore Home Health Aide Services for adults and seniors, alongside our NJ DDD-approved Community-Based Supports, Individual Supports and Respite. We will help you find the right starting point."
        photo={PHOTOS['services-welcome']}
      />

      <HomeCareFeature photo={PHOTOS['home-care-routine']} />
      <ServiceRows />

      <section className="mx-3 mt-3 rounded-[20px] bg-cream py-20 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:px-12">
          <div>
            <h2 className="text-4xl text-navy-deep md:text-5xl">How our DDD staff are vetted</h2>
            <p className="mt-5 text-lg leading-relaxed text-navy-deep">
              Every Direct Support Professional completes our full onboarding before working with anyone we support.
            </p>
          </div>
          <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {onboardingChecks.map((c) => (
              <li key={c} className="flex items-start gap-3 pb-2">
                <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <span className="text-navy-deep">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StepsSection compact />
      <CTABanner />
    </>
  );
}
