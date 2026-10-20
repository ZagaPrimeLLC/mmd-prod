import type { Metadata } from 'next';
import Link from 'next/link';
import AreaHero from '@/components/site/AreaHero';
import CTABanner from '@/components/site/CTABanner';
import { AREAS } from '@/lib/seo-content';
import { NJ_COUNTIES } from '@/lib/nj-counties';
import { pageMetadata } from '@/lib/seo-metadata';

export const metadata: Metadata = pageMetadata({
  title: 'DDD and Home Care in New Jersey',
  description:
    'Explore DDD support and Home Health Aide Services in New Jersey. MMD serves every county for DDD services; contact us to confirm home care availability in your town.',
  path: '/areas',
});

export default function AreasPage() {
  const withPages = new Set(AREAS.map((a) => a.slug));
  return (
    <>
      <AreaHero
        crumbs={[{ name: 'Areas we serve', href: '/areas' }]}
        title="DDD support and Home Health Aide Services across New Jersey"
        lead="DDD support for adults with special needs, and Home Health Aide Services for adults and seniors. Our DDD services reach every New Jersey county; home care availability is confirmed for your town and schedule."
      />
      <aside className="mx-3 mt-3 rounded-[20px] bg-cream px-6 py-8 text-navy-deep sm:px-12">
        <h2 className="text-2xl">Home Health Aide Services</h2>
        <p className="mt-3 max-w-3xl text-lg">Our Home Health Aide Services offer personal care, companionship and help with everyday routines. Share your town or ZIP code and preferred schedule so our team can confirm availability.</p>
        <Link href="/services/home-health-aide" className="mt-4 inline-block font-medium underline decoration-gold decoration-2 underline-offset-4">Explore Home Health Aide Services</Link>
      </aside>
      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-20 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-14 px-5 sm:px-8  lg:px-12">
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
              Don’t see a page for your county yet? Our DDD services cover every county. For DDD or Home Health Aide Services,
              get in touch with your town and the support you need so we can confirm staffing and availability.
            </p>
          </div>
        </div>
      </section>
      <CTABanner />
    </>
  );
}
