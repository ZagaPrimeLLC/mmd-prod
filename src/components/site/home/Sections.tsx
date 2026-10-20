import Link from 'next/link';
import Image from 'next/image';
import { Heart, Award, Users, ArrowRight } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import Faqs from '@/components/site/Faqs';
import LoopVideo from '@/components/site/LoopVideo';
import ServiceRibbon from '@/components/site/ServiceRibbon';
import HomeCareFeature from '@/components/site/HomeCareFeature';
import { DDD_SERVICES } from '@/lib/seo-content';
import { getSlotSafe } from '@/lib/cms/read';
import { PHOTOS, type Photo } from '@/lib/photos';
import type { Job } from '@/lib/jobs';

export const BUTTON =
  'inline-flex items-center justify-center rounded-full px-7 py-3.5 text-[17px] font-medium transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';

const TRUST_ICONS = [Heart, Award, Users];

const WHERE_SHORT: Record<string, string> = {
  'community-based-supports': 'Out and about',
  'individual-supports': 'At home',
  respite: 'A break for family',
};

const SERVICE_PHOTO: Record<string, Photo> = {
  'community-based-supports': PHOTOS.walk,
  'individual-supports': PHOTOS.boardgame,
  respite: PHOTOS.respite,
};

/**
 * The opening: one moment at home, across the full width, with the offer laid
 * over it. Phones get a close 4:3 view above the copy; desktops get the
 * 16:9 cut, so nobody's head is cropped away.
 */
export async function HeroFilm() {
  const [badge, title, lead, primary, secondary, trust, ribbon] = await Promise.all([
    getSlotSafe('home.hero.badge'), getSlotSafe('home.hero.title'), getSlotSafe('home.hero.lead'),
    getSlotSafe('home.hero.cta_primary'), getSlotSafe('home.hero.cta_secondary'), getSlotSafe('home.hero.trust'), getSlotSafe('home.ribbon.messages'),
  ]);
  return (
    <>
    <section data-track-slot="home.hero" className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-cream text-navy-deep">
      <div className="relative flex flex-col lg:min-h-[min(calc(100svh-100px),54rem)] lg:justify-center">
        <div className="relative aspect-[4/3] w-full overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto">
          <LoopVideo src="/video/hero-mobile-v2.mp4" poster="/video/hero-mobile-v2.jpg" label="An MMD support professional sharing a bright breakfast moment with an adult at home" className="absolute inset-0 h-full w-full object-cover object-top lg:hidden" />
          <LoopVideo src="/video/hero-wide-v2.mp4" poster="/video/hero-wide-v2.jpg" label="An MMD support professional sharing a bright breakfast moment with an adult at home" className="absolute inset-0 hidden h-full w-full object-cover object-right-top lg:block" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,#f5f2e9_0%,rgba(245,242,233,.98)_22%,rgba(245,242,233,.88)_34%,rgba(245,242,233,0)_58%)] lg:block" />
        <div className="relative px-6 py-10 sm:px-12 lg:max-w-[46%] lg:py-16">
          <p className="inline-flex animate-mmd-rise items-center rounded-full bg-navy-deep px-4 py-1.5 text-sm font-medium text-gold-crest ring-1 ring-gold-crest">
            {badge.text}
          </p>
          <h1 className="mt-5 animate-mmd-rise text-[2.2rem] font-normal leading-[1.05] sm:text-[3.25rem] xl:text-[4.1rem] [animation-delay:60ms]">
            {title.lead} {title.accent && <span className="text-gold-deep">{title.accent}</span>}
          </h1>
          <p className="mt-6 max-w-[52ch] animate-mmd-rise text-lg leading-[1.55] [animation-delay:120ms] md:text-xl">
            {lead.text}
          </p>
          <div className="mt-9 flex animate-mmd-rise flex-wrap items-center gap-3 [animation-delay:180ms]">
            <Link href={primary.href} data-cta="book-consultation" data-placement="home-hero" className={`${BUTTON} gap-2 bg-gold-crest text-navy-deep hover:bg-gold`}>
              {primary.label}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link href={secondary.href} data-cta="our-services" data-placement="home-hero" className={`${BUTTON} bg-transparent text-navy-deep ring-1 ring-navy-deep/40 hover:bg-white`}>
              {secondary.label}
            </Link>
          </div>
          <ul className="mt-9 flex animate-mmd-rise flex-wrap gap-x-7 gap-y-3 text-[15px] font-medium [animation-delay:240ms] max-sm:pr-20">
            {trust.items.map((label, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <li key={label} className="flex items-center gap-2">
                  <Icon aria-hidden className="h-4 w-4 text-gold-deep" />
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
    <ServiceRibbon items={ribbon.items} />
    </>
  );
}

/** The three services: a photograph each, what it is, and what it includes. */
export function WhatWeDo() {
  return (
    <>
    <HomeCareFeature photo={PHOTOS['home-care-porch']} />
    <section data-track-slot="home.what-we-do" className="mx-3 mt-3 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <Reveal>
          <h2 className="text-[2.6rem] text-navy-deep md:text-[3.6rem]">Developmental Disability Services</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="max-w-[48ch] text-lg leading-[1.55] text-navy-deep">
            Three New Jersey DDD services, paid through the person’s DDD budget and built around their Individualized Service Plan.
          </p>
        </Reveal>
      </div>
      <div className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-3">
        {DDD_SERVICES.map((s, i) => {
          const p = SERVICE_PHOTO[s.slug];
          return (
            <Reveal key={s.slug} delay={i * 90} as="article" className="flex flex-col">
              <Link href={`/services/${s.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[20px]">
                <Image src={p.src} alt={p.alt} fill quality={82} sizes="(min-width: 768px) 33vw, 100vw" className="origin-top object-cover object-top transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]" />
              </Link>
              <h3 className="mt-7 text-2xl font-normal text-navy-deep lg:text-[1.75rem]">
                <Link href={`/services/${s.slug}`} className="hover:underline hover:underline-offset-[6px]">{s.name}</Link>
              </h3>
              <p className="mt-1 text-base text-soft">{WHERE_SHORT[s.slug]}</p>
              <p className="mt-4 text-[17px] leading-[1.6] text-navy-deep">{s.lead}</p>
              <ul className="mt-5 space-y-2 text-[17px] text-navy-deep">
                {s.helpsWith.slice(0, 4).map((h) => (
                  <li key={h} className="flex gap-3">
                    <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {h}
                  </li>
                ))}
              </ul>
              <Link href={`/services/${s.slug}`} className="mt-7 inline-flex self-start rounded-full bg-navy-deep px-6 py-3 text-[16px] font-medium text-paper transition hover:-translate-y-0.5 hover:bg-navy">
                About {s.name}
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
    </>
  );
}

const STRIP: Photo[] = [PHOTOS.garden, PHOTOS.art];

/** Everyday community activities, followed by ways to explore support. */
export function ContactStrip() {
  return (
    <section data-track-slot="home.community" className="mx-3 overflow-hidden rounded-[20px] bg-gold py-16 text-navy-deep md:py-24">
      <div className="px-6 sm:px-12">
        <Reveal>
          <h2 className="text-[2.6rem] md:text-[3.6rem]">Out in the community</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 max-w-[46ch] text-lg leading-[1.55]">
            Groceries, appointments, classes and the bus into town. Support goes where the person’s life goes.
          </p>
        </Reveal>
      </div>

      {/* Each tile keeps its photograph's own shape, so nothing is cropped. */}
      <div className="mt-12 grid items-center gap-3 px-6 sm:px-12 md:grid-cols-[1fr_1.78fr]">
        {STRIP.map((p, i) => (
          <div key={i} className="relative w-full overflow-hidden rounded-[20px]" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
            <Image src={p.src} alt={p.alt} fill quality={82} sizes="(min-width: 768px) 64vw, 100vw" className="object-cover object-top" />
          </div>
        ))}
      </div>

      <div className="mx-6 mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-navy-deep/25 pt-8 sm:mx-12">
        <div>
          <p className="text-2xl text-navy-deep">What would a good day look like?</p>
          <p className="mt-2 text-base text-navy-deep">Start with what matters to you. We can work out the next steps together.</p>
        </div>
        <Link href="/contact?cta=home-community#book" data-cta="book-consultation" data-placement="home-community" className={`${BUTTON} gap-3 bg-navy-deep text-paper hover:bg-navy`}>
          Let’s talk <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/** Open DSP jobs, beside the team. */
export function JobsSheet({ jobs }: { jobs: Job[] }) {
  const shown = jobs.slice(0, 6);
  return (
    <section data-track-slot="home.jobs" className="mx-3 overflow-hidden rounded-[20px] bg-navy-deep lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center">
      <Image src={PHOTOS.team.src} alt={PHOTOS.team.alt} width={PHOTOS.team.width} height={PHOTOS.team.height} quality={82} sizes="(min-width: 1024px) 54vw, 100vw" className="h-auto w-full" />
      <div>
        <div className="flex justify-center px-3 py-3 lg:px-8 lg:py-8">
          <Reveal className="w-full max-w-[34rem] rounded-[20px] bg-paper px-6 py-10 text-navy-deep sm:px-10">
            <h2 className="text-[2.4rem] md:text-[3rem]">DSP jobs in New Jersey</h2>
            <p className="mt-3 text-[17px] leading-[1.55] text-navy-deep">
              Full training, flexible schedules and cases close to home. No experience needed.
            </p>
            {shown.length > 0 ? (
              <ul className="mt-8 space-y-5">
                {shown.map((j) => (
                  <li key={j.id}>
                    <span>
                      <Link href={`/careers/${j.slug}`} className="text-[17px] font-medium underline decoration-gold decoration-2 underline-offset-4 hover:decoration-navy-deep">
                        {j.title}
                      </Link>
                      {j.location && <span className="block text-[15px] text-soft">{j.location}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-8 text-[17px]">
                No openings are listed right now. Register your interest and we will call when a case opens near you.
              </p>
            )}
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/careers#openings" data-cta="see-dsp-jobs" data-placement="home-jobs" className={`${BUTTON} bg-navy-deep text-paper hover:bg-navy`}>See all DSP jobs</Link>
              <Link href="/careers#interest" className={`${BUTTON} bg-cream text-navy-deep hover:bg-haze`}>Register your interest</Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Questions families ask, in one readable column. */
export async function FaqSplit() {
  const faq = await getSlotSafe('home.faq');
  return (
    <section data-track-slot="home.faq" className="mx-3 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-24">
      <div className="mx-auto max-w-[52rem]">
        <Faqs faqs={faq.items} title="Questions families ask" />
      </div>
    </section>
  );
}
