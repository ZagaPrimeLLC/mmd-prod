import type { Metadata } from 'next';
import Image from 'next/image';
import {
  Check, Clock, GraduationCap, HeartHandshake, CalendarClock, TrendingUp, PhoneCall, ClipboardCheck, UserCheck, Rocket,
} from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CareersForm from '@/components/site/CareersForm';
import JobListings, { type PublicJob } from '@/components/site/JobListings';
import { getOpenJobs } from '@/lib/public-jobs';
import { site, onboardingChecks } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Caregiver jobs',
  description:
    'Become a Direct Support Professional with MMD Community Care. Open DSP positions across New Jersey, flexible schedules, full training and certification support.',
  alternates: { canonical: '/careers' },
};

// Publishing or closing a job in the CRM refreshes this page straight away;
// this is only the fallback.
export const revalidate = 300;

const perks = [
  { icon: CalendarClock, title: 'Flexible schedules', body: 'Part-time, full-time, weekends and overnights. Work the hours that fit your life.' },
  { icon: GraduationCap, title: 'Paid training', body: 'Rutgers Boggs Center training and CPR and First Aid certification, with support at every step.' },
  { icon: HeartHandshake, title: 'Work that matters', body: 'Help adults with disabilities live safely, independently and with dignity in their own community.' },
  { icon: TrendingUp, title: 'Room to grow', body: 'Ongoing training on the latest NJ DDD changes, and a path into senior and coordinator roles.' },
];

const steps = [
  { icon: ClipboardCheck, title: 'Apply online', body: 'Pick a position below and send a short application. It takes a couple of minutes.' },
  { icon: PhoneCall, title: 'Quick phone call', body: 'Our hiring team calls you to talk through the role and your availability.' },
  { icon: UserCheck, title: 'Meet us in person', body: `Come to the office for your appointment, ${site.walkIn}.` },
  { icon: Rocket, title: 'Screening and training', body: 'We guide you through background checks, training and certification, then match you with a client.' },
];

export default async function CareersPage() {
  const jobs = await getOpenJobs();
  const listed: PublicJob[] = jobs.map((j) => ({
    id: j.id, slug: j.slug, title: j.title, location: j.location, summary: j.summary,
    employment_type: j.employment_type, work_mode: j.work_mode,
    pay_min: j.pay_min, pay_max: j.pay_max, pay_interval: j.pay_interval, posted_at: j.posted_at,
  }));

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Better care starts with you"
        lead="Join a team of dedicated Direct Support Professionals making a real difference in the lives of adults with special needs across New Jersey."
        image="/images/training.jpg"
        imageAlt="MMD Direct Support Professionals outside the South Plainfield office"
      />

      {/* ── Open positions ─────────────────────────────────────────── */}
      <section id="openings" className="scroll-mt-24 bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gold-deep">We are hiring</p>
              <h2 className="mt-1 text-3xl font-bold text-navy md:text-4xl">Open positions</h2>
            </div>
            <a href="#interest" className="text-sm font-semibold text-steel hover:underline">
              Don&apos;t see a fit? Register your interest →
            </a>
          </div>

          {listed.length > 0 ? (
            <JobListings jobs={listed} />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
              <h3 className="text-lg font-bold text-navy">No positions listed right now</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-gray-600">
                We hire continuously across New Jersey. Register your interest below and we will contact you when a
                case opens near you.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Why MMD ────────────────────────────────────────────────── */}
      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-navy md:text-4xl">Why work with MMD</h2>
            <p className="mt-3 text-lg text-gray-600">A New Jersey DDD approved provider that invests in the people who do the work.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy">
                  <Icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How hiring works ───────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div>
            <h2 className="text-3xl font-bold text-navy md:text-4xl">How hiring works</h2>
            <ol className="mt-8 space-y-6">
              {steps.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-4">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold/20 text-navy">
                    <Icon className="h-5 w-5" />
                    <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <div>
                    <h3 className="font-bold text-navy">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <h3 className="mt-10 font-bold text-navy">What every role requires</h3>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {onboardingChecks.map((c) => (
                <li key={c} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                  <span className="text-sm text-gray-700">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <Image
            src="/images/team-office.jpg"
            alt="MMD Direct Support Professionals outside the South Plainfield office"
            width={1200}
            height={900}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="rounded-2xl shadow-lg"
          />
        </div>
      </section>

      {/* ── General interest ───────────────────────────────────────── */}
      <section id="interest" className="scroll-mt-24 bg-cream py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:px-12">
          <div>
            <h2 className="text-3xl font-bold text-navy">Don&apos;t see the right role?</h2>
            <p className="mt-3 leading-relaxed text-gray-700">
              We take on new clients across New Jersey all the time. Tell us where and when you can work, and we will
              call you as soon as a case opens near you.
            </p>
            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <p className="flex items-center gap-2 font-semibold text-navy">
                <Clock className="h-5 w-5 text-steel" /> Prefer to come in?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                Walk-in hours for applications and paperwork are <strong>{site.walkIn}</strong> at{' '}
                {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}.
              </p>
              <a href={site.phoneHref} className="mt-4 inline-block font-semibold text-steel hover:underline">
                Or call {site.phone}
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-xl font-bold text-navy">Register your interest</h3>
            <p className="mt-2 text-sm text-gray-600">It takes a couple of minutes. We will call you to talk it through.</p>
            <div className="mt-6">
              <CareersForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
