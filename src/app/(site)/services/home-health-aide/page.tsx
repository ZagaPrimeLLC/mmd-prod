import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import Faqs from '@/components/site/Faqs';
import JsonLd from '@/components/site/JsonLd';
import Breadcrumbs from '@/components/site/Breadcrumbs';
import { getSlotSafe } from '@/lib/cms/read';
import { HOME_CARE } from '@/lib/home-care';
import { HOME_CARE_CONTACT, HOME_CARE_HREF } from '@/lib/services';
import { pageMetadata } from '@/lib/seo-metadata';
import { homeCareServiceLd } from '@/lib/schema';
import { site } from '@/lib/site';

export const revalidate = 3600;
export const metadata = pageMetadata({ title: HOME_CARE.title, description: HOME_CARE.description, path: HOME_CARE_HREF });
const button = 'inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 font-medium transition hover:-translate-y-0.5';

export default async function HomeCarePage() {
  const [headline, lead, support, schedules, steps, faq] = await Promise.all([
    getSlotSafe('homecare.hero.headline'), getSlotSafe('homecare.hero.lead'), getSlotSafe('homecare.support'),
    getSlotSafe('homecare.schedules'), getSlotSafe('homecare.steps'), getSlotSafe('homecare.faq'),
  ]);
  return <>
    <JsonLd data={homeCareServiceLd()} />
    <section data-track-slot="home-care.hero" className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-navy-deep text-paper">
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        <div className="px-6 py-12 sm:px-12 lg:py-20">
          <Breadcrumbs tone="dark" trail={[{ name: 'Services', href: '/services' }, { name: HOME_CARE.name, href: HOME_CARE_HREF }]} />
          <p className="mt-12 text-sm font-medium uppercase tracking-[.15em] text-gold-crest">Home Health Aide Services · New Jersey</p>
          <h1 className="mt-5 max-w-[14ch] text-[2.8rem] leading-[1.04] sm:text-[4rem] xl:text-[5rem]">{headline.text}</h1>
          <p className="mt-7 max-w-[48ch] text-lg leading-relaxed text-paper/90">{lead.text}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href={`${HOME_CARE_CONTACT}#send-a-message`} data-cta="home-care-enquiry" data-placement="home-care-hero" className={`${button} bg-gold-crest text-navy-deep hover:bg-gold`}>Talk to us about home care <ArrowUpRight aria-hidden className="h-5 w-5" /></Link>
            <a href={site.phoneHref} data-cta="call-home-care" data-placement="home-care-hero" className={`${button} ring-1 ring-paper/50 hover:bg-paper/10`}>Call {site.phone}</a>
          </div>
          <p className="mt-8 text-sm text-paper/85">Licensed, bonded and insured.</p>
        </div>
        <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-auto lg:min-h-full"><Image src="/img/home-care-embroidered.png" alt="Illustration of a caregiver and an older woman enjoying a conversation in a sunlit living room" fill priority sizes="(min-width:1024px) 49vw, 100vw" className="object-cover object-top" /></div>
      </div>
    </section>

    <section data-track-slot="home-care.support" className="mx-3 mt-3 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <Reveal><p className="text-sm uppercase tracking-[.16em] text-soft">Everyday help. Personal attention.</p><h2 className="mt-5 max-w-[14ch] text-[2.6rem] leading-tight md:text-[3.6rem]">More comfort in the place you call home.</h2><p className="mt-6 max-w-[40ch] text-lg leading-relaxed">For adults and seniors who could use a helping hand, care starts with the person: their routines, preferences and the things they want to keep doing for themselves.</p></Reveal>
          <figure className="mt-9">
            <Image src="/img/home-care-cooking.png" alt="Illustration of the MMD caregiver and an older woman preparing lunch together in her kitchen" width={1536} height={1024} sizes="(min-width:1024px) 40vw, 100vw" className="h-auto w-full rounded-xl" />
            <figcaption className="mt-3 text-sm text-soft">Familiar meals. A little help along the way.</figcaption>
          </figure>
        </div>
        <div className="divide-y divide-navy-deep/15">
          {support.items.map((item, i) => <Reveal key={item.title} delay={i * 70} as="article" className="grid grid-cols-[2rem_1fr] gap-5 py-7 first:pt-0"><span className="pt-1 text-sm text-soft">0{i + 1}</span><div><h3 className="text-2xl">{item.title}</h3><p className="mt-3 max-w-[50ch] text-lg leading-relaxed">{item.body}</p></div></Reveal>)}
        </div>
      </div>
    </section>

    <section data-track-slot="home-care.schedules" className="mx-3 mt-3 rounded-[20px] bg-cream px-6 py-16 sm:px-12 md:py-24">
      <Reveal><h2 className="text-[2.6rem] md:text-[3.6rem]">A rhythm that works for you.</h2><p className="mt-5 max-w-[54ch] text-lg leading-relaxed">Tell us when help would make a difference. We will discuss your needs, staffing availability and the right care arrangement before confirming a schedule.</p></Reveal>
      <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="divide-y divide-navy-deep/15">{schedules.items.map(item => <Reveal key={item.title} as="article" className="py-7 first:pt-0"><h3 className="text-2xl">{item.title}</h3><p className="mt-3 max-w-[60ch] text-lg leading-relaxed">{item.body}</p></Reveal>)}</div>
        <figure>
          <Image src="/img/home-care-walk.png" alt="Illustration of the same MMD caregiver and older woman enjoying a relaxed walk on a leafy path" width={1536} height={1024} sizes="(min-width:1024px) 48vw, 100vw" className="h-auto w-full rounded-xl" />
          <figcaption className="mt-3 text-sm text-soft">Time for company, conversation and the things you enjoy.</figcaption>
        </figure>
      </div>
    </section>

    <section id="getting-started" data-track-slot="home-care.start" className="mx-3 mt-3 scroll-mt-28 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-24">
      <h2 className="text-[2.6rem] md:text-[3.6rem]">Start with a conversation.</h2>
      <ol className="mt-10 space-y-8">{steps.items.map((item, i) => <li key={item.title} className="grid gap-4 md:grid-cols-[3rem_1fr_1.5fr]"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-navy-deep">{i + 1}</span><h3 className="text-2xl">{item.title}</h3><p className="max-w-[50ch] text-lg leading-relaxed">{item.body}</p></li>)}</ol>
      <div className="mt-12 grid gap-8 border-t border-navy-deep/15 pt-10 md:grid-cols-2">
        <div><h3 className="text-2xl">Location, costs and availability</h3><p className="mt-4 max-w-[50ch] text-lg leading-relaxed">Share your New Jersey town or ZIP code and preferred schedule. We will confirm home-care coverage and discuss costs and payment options for your situation.</p></div>
        <div><h3 className="text-2xl">Coordinating with the people who care</h3><p className="mt-4 max-w-[50ch] text-lg leading-relaxed">If you are returning home after a hospital or rehabilitation stay, talk with us about everyday support and communication with your family and care team. Discuss transportation, nursing or therapy needs with us so the appropriate arrangements are clear.</p></div>
      </div>
    </section>

    <section data-track-slot="home-care.routines" className="mx-3 mt-3 grid items-center gap-8 overflow-hidden rounded-[20px] bg-cream lg:grid-cols-[1.15fr_1fr]">
      <Image src="/img/home-care-reminder.png" alt="Illustration of an MMD caregiver pointing to a daily routine reminder while an older woman holds her own closed pill organizer" width={1536} height={1024} sizes="(min-width:1024px) 54vw, 100vw" className="h-auto w-full" />
      <Reveal className="px-6 pb-12 sm:px-12 lg:py-12">
        <p className="text-sm uppercase tracking-[.16em] text-soft">Everyday routines</p>
        <h2 className="mt-5 max-w-[18ch] text-[2.6rem] leading-tight md:text-[3.3rem]">A little structure. A calmer day.</h2>
        <p className="mt-6 max-w-[45ch] text-lg leading-relaxed">From keeping appointments organized to offering a timely reminder, support can help familiar routines feel more manageable.</p>
        <p className="mt-5 max-w-[45ch] text-base leading-relaxed">Medication reminders can be part of the agreed care plan. Speak with our team about medication administration or other clinical needs and the appropriate nursing arrangements.</p>
      </Reveal>
    </section>
    <section className="mx-3 mt-3 rounded-[20px] bg-cream px-6 py-16 sm:px-12"><div className="mx-auto max-w-4xl"><Faqs faqs={faq.items} title="Your home-care questions" /></div></section>
    <section data-track-slot="home-care.contact" className="mx-3 my-3 rounded-[20px] bg-navy-deep px-6 py-16 text-paper sm:px-12">
      <div className="flex flex-wrap items-center justify-between gap-8"><div><p className="flex items-center gap-2 text-gold-crest"><Check aria-hidden className="h-5 w-5" /> A conversation is a good place to start.</p><h2 className="mt-4 max-w-[24ch] text-[2.5rem] md:text-[3.5rem]">Let’s talk about what would help.</h2></div><Link href={`${HOME_CARE_CONTACT}#book`} data-cta="book-home-care" data-placement="home-care-footer" className={`${button} bg-gold-crest text-navy-deep hover:bg-gold`}>Book a free consultation <ArrowUpRight aria-hidden className="h-5 w-5" /></Link></div>
      <p className="mt-8 text-paper/80">Looking for DDD-funded support? <Link href="/getting-started" className="underline decoration-gold underline-offset-4">Explore the DDD process</Link>.</p>
    </section>
  </>;
}
