import Link from 'next/link';
import { site } from '@/lib/site';
import Reveal from '@/components/site/Reveal';
import CountUp from '@/components/site/CountUp';
import { getSlotSafe, getSchedule } from '@/lib/cms/read';
import { officeHoursLabel } from '@/lib/booking';

/** Who MMD is, in a few plain sentences. */
export async function Intro() {
  const [statement, body, schedule] = await Promise.all([getSlotSafe('home.intro.statement'), getSlotSafe('home.intro.paragraphs'), getSchedule()]);
  return (
    <section data-track-slot="home.intro" className="mx-3 mt-3 rounded-[20px] bg-paper px-6 py-16 sm:px-12 md:py-28">
      <div className="mx-auto max-w-[44rem] space-y-7 text-[19px] leading-[1.6]">
        <Reveal as="div">
          <p className="text-2xl font-normal leading-[1.3] tracking-[-0.02em] text-navy-deep md:text-[2rem]">
            {statement.text}
          </p>
        </Reveal>
        {body.paragraphs.map((text, i) => (
          <Reveal key={i} delay={80 * (i + 1)}>
            <p>{text}</p>
          </Reveal>
        ))}
        <Reveal delay={80 * (body.paragraphs.length + 1)}>
          <p>
            Our office is at{' '}
            <Link href={site.officeHref} className="font-medium text-navy-deep underline decoration-gold decoration-2 underline-offset-4">
              {site.address.street}, {site.address.city}
            </Link>
            {schedule.unavailable ? `. To visit, ${officeHoursLabel(schedule)}.` : `, and you are welcome to walk in on ${officeHoursLabel(schedule)}.`}
          </p>
        </Reveal>
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
