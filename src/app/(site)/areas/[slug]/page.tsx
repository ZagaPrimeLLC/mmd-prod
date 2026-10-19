import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo-metadata';
import { PHOTOS } from '@/lib/photos';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArtImage from '@/components/site/ArtImage';
import PageHero from '@/components/site/PageHero';
import Faqs from '@/components/site/Faqs';
import JsonLd from '@/components/site/JsonLd';
import CTABanner from '@/components/site/CTABanner';
import CountyMap from '@/components/site/CountyMap';
import { AREAS, DDD_SERVICES, areaBySlug, areaFaqs, areaForLocation } from '@/lib/seo-content';
import { serviceLd } from '@/lib/schema';
import { AREA_RESOURCES } from '@/lib/area-resources';
import { getOpenJobs } from '@/lib/public-jobs';
import { payLabel } from '@/lib/jobs';
import { site } from '@/lib/site';

export const revalidate = 3600;

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = areaBySlug((await params).slug);
  if (!a) return {};
  const description = `DDD approved Community-Based Supports, Individual Supports and Respite for adults with developmental disabilities in ${a.name} County, NJ, including ${a.towns.slice(0, 4).join(', ')}.`;
  return pageMetadata({
    title: `DDD Services in ${a.name} County, NJ`,
    description,
    path: `/areas/${a.slug}`,
  });
}

export default async function AreaPage({ params }: { params: Promise<{ slug: string }> }) {
  const a = areaBySlug((await params).slug);
  if (!a) notFound();

  const resource = AREA_RESOURCES[a.slug];
  const jobs = (await getOpenJobs()).filter((j) => areaForLocation(j.location)?.slug === a.slug);

  return (
    <>
      <JsonLd data={DDD_SERVICES.map((s) => serviceLd(s, a.name))} />
      <PageHero
        crumbs={[{ name: 'Areas we serve', href: '/areas' }, { name: `${a.name} County`, href: `/areas/${a.slug}` }]}
        title={`DDD services in ${a.name} County`}
        lead={a.intro}
        photo={PHOTOS.bus}
      />

      <section className="grid gap-3 px-3 pt-3 lg:grid-cols-2" aria-label={`Planning support in ${a.name} County`}>
        <div className="rounded-[20px] bg-paper px-6 py-14 sm:px-12">
          <h2 className="text-3xl text-navy-deep md:text-4xl">{resource.planningTitle}</h2>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-navy-deep">{resource.planning}</p>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-lg leading-relaxed text-navy-deep">
            {resource.questions.map((question) => <li key={question}>{question}</li>)}
          </ul>
          <p className="mt-6 text-base leading-relaxed text-navy-deep">
            Call <a href={site.phoneHref} className="font-medium underline underline-offset-4">{site.phone}</a> with
            your town, preferred schedule and the service you are considering. Confirm staffing and an agreed start
            date with MMD before making arrangements. Find the best way to reach us on our{' '}
            <Link href="/contact" className="underline underline-offset-4">Contact page</Link>.
          </p>
          <Link href={`/contact?cta=areas-${a.slug}#book`} className="mt-7 inline-flex rounded-full bg-navy-deep px-6 py-3 font-medium text-paper hover:bg-navy">
            Discuss support in {a.name} County
          </Link>
        </div>
        <aside className="rounded-[20px] bg-cream px-6 py-14 sm:px-12">
          <h2 className="text-3xl text-navy-deep md:text-4xl">A local resource for families</h2>
          <h3 className="mt-6 text-2xl text-navy-deep">
            <a href={resource.href} className="underline decoration-gold decoration-2 underline-offset-4">{resource.title}</a>
          </h3>
          <p className="mt-5 text-lg leading-relaxed text-navy-deep">{resource.description}</p>
          <p className="mt-5 text-base leading-relaxed text-navy-deep">
            This is an independent county resource. Contact the county for its programs and your support coordinator
            for DDD eligibility, service planning and authorizations.
          </p>
          <Link href="/getting-started" className="mt-7 inline-flex font-medium text-navy-deep underline underline-offset-4">
            Read the guide to starting NJ DDD services
          </Link>
        </aside>
      </section>

      <section className="grid gap-3 px-3 pt-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[20px] bg-paper px-6 py-14 sm:px-12 md:py-20">
          <h2 className="text-[2.4rem] text-navy-deep md:text-[3rem]">Services in {a.name} County</h2>
          <ul className="mt-10 space-y-10">
            {DDD_SERVICES.map((s) => (
              <li key={s.slug}>
                <h3 className="text-[1.6rem] font-normal text-navy-deep">
                  <Link href={`/services/${s.slug}`} className="underline decoration-gold decoration-2 underline-offset-[6px] hover:decoration-navy-deep">{s.name}</Link>
                </h3>
                <p className="mt-3 max-w-[60ch] text-[18px] leading-[1.6] text-navy-deep">{s.lead}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center justify-center rounded-[20px] bg-cream p-8">
          <CountyMap pages={AREAS.map((x) => x.slug)} highlight={a.slug} />
        </div>
      </section>

      <section className="grid gap-3 px-3 pt-3 lg:grid-cols-2">
        <div className="rounded-[20px] bg-gold px-6 py-14 text-navy-deep sm:px-12">
          <h2 className="text-[2.4rem] md:text-[3rem]">Towns we cover</h2>
          <p className="mt-4 text-[18px]">Including, but not limited to:</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-[19px] sm:grid-cols-3">
            {a.towns.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-[20px] bg-navy-deep px-6 py-14 text-paper sm:px-12">
          <ArtImage photo={PHOTOS.team} className="opacity-25" position="center 20%" sizes="50vw" />
          <div className="relative">
            <h2 className="text-[2.4rem] md:text-[3rem]">Jobs in {a.name} County</h2>
            {jobs.length > 0 ? (
              <ul className="mt-8 space-y-5 text-[17px]">
                {jobs.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <span>
                      <Link href={`/careers/${j.slug}`} className="font-medium underline decoration-gold decoration-2 underline-offset-4">{j.title}</Link>
                      {j.location && <span className="block text-[15px] text-paper/80">{j.location}</span>}
                    </span>
                    <span className="text-[15px] text-paper/80">{payLabel(j) ?? 'Pay on call'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 max-w-[44ch] text-[18px] leading-[1.6]">
                No openings listed here right now. <Link href="/careers#interest" className="font-medium underline decoration-gold decoration-2 underline-offset-4">Register your interest</Link> and we will call when a case opens nearby.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 px-3 pt-3 lg:grid-cols-2">
        <div className="rounded-[20px] bg-paper px-6 py-14 sm:px-12 md:py-20">
          <Faqs faqs={areaFaqs(a)} title="Common questions" />
        </div>
        <div className="rounded-[20px] bg-cream px-6 py-14 sm:px-12 md:py-20">
          <h2 className="text-[2.4rem] text-navy-deep md:text-[3rem]">Other counties we serve</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 text-[18px]">
            {AREAS.filter((x) => x.slug !== a.slug).map((x) => (
              <li key={x.slug}><Link href={`/areas/${x.slug}`} className="font-medium text-navy-deep underline decoration-gold decoration-2 underline-offset-4">{x.name} County</Link></li>
            ))}
            <li><Link href="/areas" className="font-medium text-navy-deep underline underline-offset-4">All areas</Link></li>
          </ul>
        </div>
      </section>

      <CTABanner title={`Support in ${a.name} County`} />
    </>
  );
}
