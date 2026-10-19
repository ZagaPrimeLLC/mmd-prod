import type { Metadata } from 'next';
import { PHOTOS } from '@/lib/photos';
import Link from 'next/link';
import PageHero from '@/components/site/PageHero';
import CountyMap from '@/components/site/CountyMap';
import CTABanner from '@/components/site/CTABanner';
import { AREAS } from '@/lib/seo-content';
import { NJ_COUNTIES } from '@/lib/nj-counties';

export const metadata: Metadata = {
  title: 'Areas We Serve in New Jersey',
  description:
    'MMD Community Care provides DDD services to adults in every county in New Jersey, from our office in South Plainfield, Middlesex County.',
  alternates: { canonical: '/areas' },
};

export default function AreasPage() {
  const withPages = new Set(AREAS.map((a) => a.slug));
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Areas we serve', href: '/areas' }]}
        title="DDD support across New Jersey"
        lead="Our office is in South Plainfield, Middlesex County, and our Direct Support Professionals work with adults and families statewide."
        photo={PHOTOS.walk}
      />
      <aside className="mx-3 mt-3 rounded-[20px] bg-cream px-6 py-8 text-navy-deep sm:px-12">
        <h2 className="text-2xl">Looking for Home Health Aide Services?</h2>
        <p className="mt-3 max-w-3xl text-lg">The county map below describes our DDD services. For home care, share your town or ZIP code and preferred schedule so our team can confirm availability.</p>
        <Link href="/services/home-health-aide" className="mt-4 inline-block font-medium underline decoration-gold decoration-2 underline-offset-4">Explore Home Health Aide Services</Link>
      </aside>
      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-20 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-14 px-5 sm:px-8 md:grid-cols-[auto_minmax(0,1fr)] lg:gap-24 lg:px-12">
          <div className="flex justify-center">
            <CountyMap pages={AREAS.map((a) => a.slug)} />
          </div>
          <div>
            <h2 className="text-3xl text-navy-deep md:text-4xl">Choose your county</h2>
            <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {NJ_COUNTIES.map((c) => (
                <li key={c.slug}>
                  {withPages.has(c.slug) ? (
                    <Link href={`/areas/${c.slug}`} className="font-semibold text-navy underline decoration-gold/60 decoration-2 underline-offset-4 hover:decoration-gold">
                      {c.name} County
                    </Link>
                  ) : (
                    <Link href={`/contact?cta=areas-${c.slug}`} className="text-navy-deep underline decoration-navy/20 underline-offset-4 hover:text-navy">
                      {c.name} County
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-8 max-w-xl leading-relaxed text-navy-deep">
              Don’t see a page for your county yet? We still serve it. Get in touch with the town and we will confirm
              how quickly we can staff support.
            </p>
          </div>
        </div>
      </section>
      <CTABanner />
    </>
  );
}
