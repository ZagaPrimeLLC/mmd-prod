import Link from 'next/link';
import Reveal from '@/components/site/Reveal';
import { GETTING_STARTED } from '@/lib/seo-content';

/** The first sentence of a paragraph, for the short version of the steps. */
function firstSentence(text: string) {
  return text.split(/(?<=\.)\s+/)[0];
}

/** Starting DDD services: a real sequence, so the steps are numbered. */
export default function StepsSection({ compact = false }: { compact?: boolean }) {
  return (
    <section data-track-slot="steps" className="mx-3 mt-3 rounded-[20px] bg-cream px-6 py-16 sm:px-12 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
        <Reveal>
          <h2 className="max-w-[14ch] text-[2.6rem] text-navy-deep md:text-[3.6rem]">Starting with DDD</h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="max-w-[48ch] text-lg leading-[1.55] text-navy-deep">
            New to the Division of Developmental Disabilities? Here is the path from eligibility to the first visit. We are glad to
            talk any of it through, free.
          </p>
        </Reveal>
      </div>
      <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-5">
        {GETTING_STARTED.map((s, i) => (
          <Reveal key={s.title} as="li" delay={i * 70}>
            <span aria-hidden className="block text-[3.5rem] font-light leading-none tracking-[-0.04em] text-navy">{i + 1}</span>
            <h3 className="mt-4 text-[1.35rem] font-medium text-navy-deep">{s.title}</h3>
            <p className="mt-3 text-[16px] leading-[1.6] text-navy-deep">{compact ? firstSentence(s.body) : s.body}</p>
          </Reveal>
        ))}
      </ol>
      {compact && (
        <Link href="/getting-started" className="mt-12 inline-flex rounded-full bg-navy-deep px-6 py-3 text-[16px] font-medium text-paper transition hover:-translate-y-0.5 hover:bg-navy">
          Read the full guide
        </Link>
      )}
    </section>
  );
}
