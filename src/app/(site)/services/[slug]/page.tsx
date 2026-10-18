import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo-metadata';
import { PHOTOS, type Photo } from '@/lib/photos';
import ArtImage from '@/components/site/ArtImage';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/components/site/PageHero';
import Faqs from '@/components/site/Faqs';
import JsonLd from '@/components/site/JsonLd';
import CTABanner from '@/components/site/CTABanner';
import Reveal from '@/components/site/Reveal';
import { DDD_SERVICES, AREAS, serviceBySlug } from '@/lib/seo-content';
import { serviceLd } from '@/lib/schema';
import { site } from '@/lib/site';

export function generateStaticParams() {
  return DDD_SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = serviceBySlug((await params).slug);
  if (!s) return {};
  return pageMetadata({
    title: s.title,
    description: s.metaDescription,
    path: `/services/${s.slug}`,
  });
}

// A second picture per service, in a band of its own.
const SECOND: Record<string, Photo> = {
  'community-based-supports': PHOTOS.bus,
  'individual-supports': PHOTOS.hands,
  respite: PHOTOS.park,
};

/** A band the shape of its photograph at every width, so nothing is cropped. */
function bandAspect(p: Photo) {
  const hasUltra = Boolean(p.ultra && p.ultra !== p.wide);
  const phone = p.height > p.width ? 'aspect-[4/5] sm:aspect-video' : p.height === p.width ? 'aspect-square sm:aspect-video' : 'aspect-video';
  return `${phone} ${hasUltra ? 'xl:aspect-[21/9]' : ''}`;
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = serviceBySlug((await params).slug);
  if (!s) notFound();
  const others = DDD_SERVICES.filter((o) => o.slug !== s.slug);

  return (
    <>
      <JsonLd data={serviceLd(s)} />
      <PageHero
        crumbs={[{ name: 'Services', href: '/services' }, { name: s.name, href: `/services/${s.slug}` }]}
        title={s.title}
        lead={s.lead}
        photo={PHOTOS[s.photo]}
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <Link href={`/contact?cta=service-${s.slug}#book`} data-cta="book-consultation" data-placement="service-hero" className="inline-flex items-center justify-center rounded-full bg-paper px-7 py-3.5 text-[17px] font-medium text-navy-deep transition hover:-translate-y-0.5 hover:bg-white">
            Book a free consultation
          </Link>
          <a href={site.phoneHref} className="text-[17px] font-medium text-paper underline decoration-gold decoration-2 underline-offset-[6px]">
            Or call {site.phone}
          </a>
        </div>
      </PageHero>

      <section className="grid gap-3 px-3 pt-3 lg:grid-cols-2">
        <div className="rounded-[20px] bg-paper px-6 py-14 sm:px-12 md:py-20">
          <h2 className="text-[2.4rem] text-navy-deep md:text-[3rem]">What {s.name} means</h2>
          <div className="mt-6 max-w-[60ch] space-y-5 text-[19px] leading-[1.6] text-navy-deep">
            {s.body.map((p) => <p key={p}>{p}</p>)}
            <p className="text-[17px] text-soft">Also called {s.aka.join(', ')}.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="rounded-[20px] bg-navy-deep px-6 py-14 text-paper sm:px-12">
            <Reveal><h2 className="text-[2.2rem]">What it can include</h2></Reveal>
            <ul className="mt-6 space-y-3 text-[18px]">
              {s.helpsWith.map((h) => (
                <li key={h} className="flex gap-3"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{h}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[20px] bg-cream px-6 py-14 text-navy-deep sm:px-12">
            <Reveal><h2 className="text-[2.2rem]">A good fit if</h2></Reveal>
            <ul className="mt-6 space-y-3 text-[18px]">
              {s.goodFitIf.map((h) => (
                <li key={h} className="flex gap-3"><span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-deep" />{h}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-3 px-3 pt-3">
        <div className={`relative overflow-hidden rounded-[20px] ${bandAspect(SECOND[s.slug])}`}>
          <ArtImage photo={SECOND[s.slug]} className="mmd-drift" />
        </div>
        <div className="rounded-[20px] bg-paper px-6 py-14 sm:px-12 md:py-20">
          <div className="mx-auto max-w-[52rem]">
          <Faqs faqs={s.faqs} title="Common questions" />
          <p className="mt-10 text-[17px] text-navy-deep">
            New to DDD? <Link href="/getting-started" className="font-medium underline decoration-gold decoration-2 underline-offset-4">How to start DDD services, step by step</Link>
          </p>
          </div>
        </div>
      </section>

      <section className="px-3 pt-3">
        <div className="rounded-[20px] bg-gold px-6 py-14 text-navy-deep sm:px-12 md:py-20">
          <h2 className="text-[2.4rem] md:text-[3rem]">{s.name} near you</h2>
          <p className="mt-4 max-w-[52ch] text-[18px]">We provide {s.name} in every county in New Jersey, including:</p>
          <ul className="mt-8 grid gap-x-8 gap-y-3 text-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {AREAS.map((a) => (
              <li key={a.slug}>
                <Link href={`/areas/${a.slug}`} className="font-medium underline decoration-navy-deep/40 decoration-2 underline-offset-4 hover:decoration-navy-deep">
                  {a.name} County
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-3 px-3 pt-3 md:grid-cols-2">
        {others.map((o) => (
          <Link key={o.slug} href={`/services/${o.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[20px] text-paper lg:aspect-video">
            <ArtImage photo={PHOTOS[o.photo]} noUltra sizes="(min-width: 768px) 50vw, 100vw" className="transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />{/* taste-skill-ignore: scrim over the photo so the text reads */}
            <div className="absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10">
              <p className="text-[2rem] font-light tracking-[-0.03em]">{o.name}</p>
              <p className="mt-2 max-w-[44ch] text-[17px] text-paper/90">{o.lead}</p>
            </div>
          </Link>
        ))}
      </section>

      <CTABanner />
    </>
  );
}
