import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { PHOTOS } from '@/lib/photos';
import Reveal from '@/components/site/Reveal';
import CountUp from '@/components/site/CountUp';
import { getSlotSafe } from '@/lib/cms/read';

/** A glimpse of everyday support, with details editable through the CMS. */
export async function Intro() {
  const [headline, description, highlights, cta] = await Promise.all([
    getSlotSafe('home.approach.headline'), getSlotSafe('home.approach.description'),
    getSlotSafe('home.approach.highlights'), getSlotSafe('home.approach.cta'),
  ]);
  return (
    <section id="our-approach" aria-labelledby="approach-title" data-track-slot="home.intro" className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-paper p-3 sm:p-6 lg:p-10">
      <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 xl:gap-20">
        <Reveal className="relative aspect-[4/5] overflow-hidden rounded-[14px] sm:max-lg:aspect-[5/4] lg:aspect-auto lg:min-h-[38rem]">
          <Image src={PHOTOS.library.src} alt={PHOTOS.library.alt} fill sizes="(min-width: 1024px) 43vw, 100vw" className="object-cover object-center" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-deep/80 to-transparent px-7 pb-8 pt-24 text-paper">
            <p className="text-sm font-medium tracking-[0.08em]">EVERYDAY LIFE. YOUR WAY.</p>
          </div>
        </Reveal>
        <div className="px-3 pb-7 sm:px-4 lg:px-0 lg:py-6">
          <Reveal>
            <p className="mb-5 flex items-center gap-3 text-sm font-medium text-soft"><span aria-hidden="true" className="h-px w-8 bg-gold" />Our approach</p>
            <h2 id="approach-title" className="max-w-[16ch] text-[2.6rem] leading-[1.06] text-navy-deep sm:text-[3.3rem] xl:text-[3.9rem]">{headline.text}</h2>
            <p className="mt-6 max-w-[48ch] text-lg leading-[1.65] text-navy-deep">{description.text}</p>
          </Reveal>
          <dl className="mt-8 border-t border-navy-deep/15">
            {highlights.items.map((item, i) => (
              <Reveal key={i} delay={80 * (i + 1)} className="border-b border-navy-deep/15 py-5">
                <dt className="flex items-center gap-4 text-xl font-medium text-navy-deep">
                  <span aria-hidden="true" className="w-8 shrink-0 text-sm text-gold-deep">{String(i + 1).padStart(2, '0')}</span>{item.title}
                </dt>
                <dd className="ml-12 mt-1 text-[16px] leading-relaxed text-soft">{item.body}</dd>
              </Reveal>
            ))}
          </dl>
          <Reveal delay={320}>
            <Link href={cta.href} data-cta="explore-approach" data-placement="home-intro" className="mt-8 inline-flex min-h-11 items-center gap-4 border-b border-navy-deep pb-1 text-[17px] font-medium text-navy-deep transition hover:gap-6">
              {cta.label}<ArrowUpRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const FIGURES = [
  { value: 100, suffix: '+', text: 'families served across New Jersey.' },
  { value: 100, suffix: '+', text: 'trained care professionals on the team.' },
  { value: 4, suffix: '+', text: 'years delivering DDD services.' },
  { value: 100, suffix: '%', text: 'statewide: we serve every county in New Jersey.' },
];

export function Figures() {
  return (
    <section data-track-slot="home.figures" className="mx-3 mt-3 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-28">
      <h2 className="text-[2.6rem] text-navy-deep md:text-[3.4rem]">MMD in numbers</h2>
      <dl className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {FIGURES.map((f, i) => (
          <Reveal key={f.text} delay={i * 70}>
            <dt className="text-[3.5rem] font-light leading-none tracking-[-0.04em] text-navy-deep lg:text-[5rem]">
              <CountUp value={f.value} suffix={f.suffix} />
            </dt>
            <dd className="mt-3 max-w-[26ch] text-[19px] leading-snug text-navy-deep">{f.text}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}
