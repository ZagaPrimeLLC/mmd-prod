import Link from 'next/link';
import Image from 'next/image';
import { Heart, Award, Users, ArrowRight } from 'lucide-react';
import { site } from '@/lib/site';
import Reveal from '@/components/site/Reveal';
import Faqs from '@/components/site/Faqs';
import LoopVideo from '@/components/site/LoopVideo';
import WalkInStatus from '@/components/site/WalkInStatus';
import ArtImage from '@/components/site/ArtImage';
import { DDD_SERVICES } from '@/lib/seo-content';
import { getSlotSafe, getSchedule } from '@/lib/cms/read';
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
 * over it. Phones get the portrait cut of the film, everything wider gets the
 * 16:9 cut, so nobody's head is cropped away.
 */
export async function HeroFilm() {
  const [badge, title, lead, primary, secondary, trust, schedule] = await Promise.all([
    getSlotSafe('home.hero.badge'), getSlotSafe('home.hero.title'), getSlotSafe('home.hero.lead'),
    getSlotSafe('home.hero.cta_primary'), getSlotSafe('home.hero.cta_secondary'), getSlotSafe('home.hero.trust'), getSchedule(),
  ]);
  return (
    <section data-track-slot="home.hero" className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-navy-deep text-paper">
      <div className="relative flex min-h-[min(calc(100svh-84px),56rem)] flex-col justify-end">
        <LoopVideo
          src="/video/kitchen-portrait.mp4"
          poster="/video/kitchen-portrait.jpg"
          label={PHOTOS.kitchen.alt}
          className="absolute inset-0 h-full w-full object-cover sm:hidden"
        />
        <LoopVideo
          src="/video/kitchen-wide.mp4"
          poster="/video/kitchen-wide.jpg"
          label={PHOTOS.kitchen.alt}
          className="absolute inset-0 hidden h-full w-full object-cover object-[center_12%] sm:block"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />{/* taste-skill-ignore: scrim over the film so the text reads */}
        <div className="relative px-6 pb-10 pt-40 sm:px-12 lg:pb-14">
          <p className="inline-flex animate-mmd-rise items-center rounded-full bg-navy-deep/60 px-4 py-1.5 text-sm font-medium text-gold-crest ring-1 ring-gold-crest">
            {badge.text}
          </p>
          <h1 className="mt-5 animate-mmd-rise text-[2.2rem] font-normal sm:max-w-[20ch] sm:text-[4.25rem] xl:text-[5.25rem] [animation-delay:60ms]">
            {title.lead} {title.accent && <span className="text-gold-crest">{title.accent}</span>}
          </h1>
          <p className="mt-6 max-w-[52ch] animate-mmd-rise text-lg leading-[1.55] [animation-delay:120ms] md:text-xl">
            {lead.text}
          </p>
          <div className="mt-9 flex animate-mmd-rise flex-wrap items-center gap-3 [animation-delay:180ms]">
            <Link href={primary.href} data-cta="book-consultation" data-placement="home-hero" className={`${BUTTON} gap-2 bg-gold-crest text-navy-deep hover:bg-gold`}>
              {primary.label}
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link href={secondary.href} data-cta="our-services" data-placement="home-hero" className={`${BUTTON} bg-transparent text-paper ring-1 ring-paper hover:bg-paper hover:text-navy-deep`}>
              {secondary.label}
            </Link>
          </div>
          <ul className="mt-9 flex animate-mmd-rise flex-wrap gap-x-7 gap-y-3 text-[15px] font-medium [animation-delay:240ms] max-sm:pr-20">
            {trust.items.map((label, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
              return (
                <li key={label} className="flex items-center gap-2">
                  <Icon aria-hidden className="h-4 w-4 text-gold-crest" />
                  {label}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-paper px-6 py-4 text-[15px] text-navy-deep sm:px-12">
        <WalkInStatus schedule={schedule} />
        <Link href={site.officeHref} className="mr-14 font-medium underline-offset-4 hover:underline">
          {site.address.street}, {site.address.city}
        </Link>
      </div>
    </section>
  );
}

/** The three services: a photograph each, what it is, and what it includes. */
export function WhatWeDo() {
  return (
    <section data-track-slot="home.what-we-do" className="mx-3 mt-3 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <Reveal>
          <h2 className="text-[2.6rem] text-navy-deep md:text-[3.6rem]">What we do</h2>
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
                <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]" />
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
  );
}

const STRIP: Photo[] = [PHOTOS.grocery, PHOTOS.garden, PHOTOS.art, PHOTOS.bus];

/** Where the office is, whether it is open now, and the number to call. */
export async function ContactStrip() {
  const schedule = await getSchedule();
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
      <div className="mmd-marquee mt-12 flex w-max gap-3" aria-hidden>
        {[...STRIP, ...STRIP].map((p, i) => (
          <div key={i} className="relative h-64 shrink-0 overflow-hidden rounded-[20px] md:h-80" style={{ aspectRatio: `${p.width} / ${p.height}` }}>
            <Image src={p.src} alt="" fill sizes="480px" className="object-cover" />
          </div>
        ))}
      </div>
      <ul className="sr-only">
        {STRIP.map((p) => <li key={p.src}>{p.alt}</li>)}
      </ul>

      <div className="mt-12 grid gap-3 px-3 md:grid-cols-3">
        <Link href={site.officeHref} data-cta="office-map" data-placement="home-contact-strip" className="group rounded-[20px] bg-paper px-6 py-6 transition hover:bg-white">
          <span className="block text-base text-soft">Our office</span>
          <span className="mt-1 block text-xl font-medium group-hover:underline group-hover:underline-offset-4">
            {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
          </span>
          <span className="mt-3 block text-base text-navy-deep">See it on the map</span>
        </Link>
        <div className="rounded-[20px] bg-paper px-6 py-6">
          <span className="block text-base text-soft">Walk in, no appointment</span>
          <WalkInStatus className="mt-1 text-xl font-medium" schedule={schedule} />
          <span className="mt-3 block text-base text-navy-deep">Bring paperwork or just come and meet us.</span>
        </div>
        <a href={site.phoneHref} data-cta="call-office" data-placement="home-contact-strip" className="group rounded-[20px] bg-navy-deep px-6 py-6 text-paper transition hover:bg-navy">
          <span className="block text-base text-paper/75">Call the office</span>
          <span className="mt-1 block text-xl font-medium">{site.phone}</span>
          <span className="mt-3 block text-base text-paper/75">A person answers, not a menu.</span>
        </a>
      </div>
    </section>
  );
}

/** Open DSP jobs, beside the team. */
export function JobsSheet({ jobs }: { jobs: Job[] }) {
  const shown = jobs.slice(0, 6);
  return (
    <section data-track-slot="home.jobs" className="mx-3 overflow-hidden rounded-[20px] bg-navy-deep">
      <div className="relative aspect-[3/2] md:hidden">
        <Image src={PHOTOS.team.src} alt={PHOTOS.team.alt} fill sizes="100vw" className="object-cover" />
      </div>
      <div className="relative md:aspect-[21/9]">
        <div className="absolute inset-0 hidden md:block">
          <ArtImage photo={PHOTOS.team} className="mmd-drift" position="center 20%" sizes="100vw" />
        </div>
        <div className="relative px-3 py-3 md:flex md:min-h-full md:items-center md:justify-end md:px-10 md:py-14">
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

/**
 * The closing film: a moment on a park bench. On wide screens the offer sits
 * over the empty half of the frame; on phones it follows underneath.
 */
export function CtaFilm({ title = 'Talk to us about your family' }: { title?: string }) {
  return (
    <section data-track-slot="cta-film" className="mx-3 mb-3 overflow-hidden rounded-[20px] bg-navy-deep text-paper">
      <div className="relative">
        <div className="relative aspect-video max-h-[85svh] w-full">
          <LoopVideo src="/video/park-bench.mp4" poster="/video/park-bench.jpg" label={PHOTOS.park.alt} className="absolute inset-0 h-full w-full object-cover object-[25%_30%]" />
          <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-l from-black/70 via-black/30 to-transparent lg:block" />{/* taste-skill-ignore: scrim over the film so the text reads */}
        </div>
        <div className="px-6 py-12 sm:px-12 lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:w-1/2 lg:items-center lg:py-0">
          <div>
            <Reveal>
              <h2 className="max-w-[16ch] text-[2rem] sm:text-[2.6rem] lg:text-[3.6rem]">{title}</h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-5 max-w-[40ch] text-lg leading-[1.55] text-paper/90">
                A free consultation, by phone or at our office in South Plainfield. We explain how DDD services work and what we
                can offer, with no obligation.
              </p>
            </Reveal>
            <Reveal delay={160} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="/contact?cta=cta-film#book" data-cta="book-consultation" data-placement="cta-film" className={`${BUTTON} bg-paper text-navy-deep hover:bg-white`}>
                Book a free consultation
              </Link>
              <a href={site.phoneHref} className="text-[17px] font-medium underline decoration-gold decoration-2 underline-offset-[6px] hover:decoration-paper">
                Call {site.phone}
              </a>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
