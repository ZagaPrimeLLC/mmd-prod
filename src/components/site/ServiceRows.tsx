import Link from 'next/link';
import Image from 'next/image';
import Reveal from '@/components/site/Reveal';
import { DDD_SERVICES } from '@/lib/seo-content';
import { PHOTOS } from '@/lib/photos';

/** The three DDD services, each with its photograph beside the words. */
export default function ServiceRows() {
  return (
    <section className="space-y-3 px-3 pt-3">
      <div className="rounded-[20px] bg-paper px-6 py-14 sm:px-12">
        <h2 className="max-w-[18ch] text-[2.6rem] text-navy-deep md:text-[3.4rem]">Three ways we support adults</h2>
        <p className="mt-5 max-w-[56ch] text-lg leading-[1.55] text-navy-deep">
          Every service is funded through the person’s DDD budget and built around the goals in their Individualized Service Plan.
        </p>
      </div>
      {DDD_SERVICES.map((s, i) => {
        const p = PHOTOS[s.photo];
        return (
          <article key={s.slug} id={s.legacySlug} className="grid scroll-mt-24 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className={`relative overflow-hidden rounded-[20px] ${i % 2 ? 'lg:order-2' : ''}`} style={{ aspectRatio: `${p.width} / ${p.height}` }}>
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center rounded-[20px] bg-paper px-6 py-12 sm:px-12">
              <Reveal><h3 className="text-[2.2rem] font-light text-navy-deep md:text-[2.8rem]">{s.name}</h3></Reveal>
              <Reveal delay={80}><p className="mt-4 max-w-[48ch] text-lg leading-[1.55] text-navy-deep">{s.lead}</p></Reveal>
              <Reveal delay={160}>
                <ul className="mt-6 space-y-2">
                  {s.helpsWith.map((h) => (
                    <li key={h} className="flex gap-3 text-[17px] text-navy-deep">
                      <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {h}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Link href={`/services/${s.slug}`} className="mt-8 inline-flex self-start rounded-full bg-navy-deep px-6 py-3 text-[16px] font-medium text-paper transition hover:-translate-y-0.5 hover:bg-navy">
                About {s.name}
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
