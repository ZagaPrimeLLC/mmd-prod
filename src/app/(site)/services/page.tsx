import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CTABanner from '@/components/site/CTABanner';
import { serviceDetail, onboardingChecks } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Our services',
  description:
    'Individual Support, Respite Care and Community Support for adults with developmental disabilities across New Jersey. NJ DDD approved provider.',
  alternates: { canonical: '/services' },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Support that fits the person"
        lead="The State of New Jersey Division of Developmental Disabilities has approved our agency to provide community-based support, respite and individual support to adults with disabilities."
        image="/images/games.jpg"
        imageAlt="An MMD support worker accompanying a client in the community"
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl space-y-16 px-5 sm:px-8 lg:px-12">
          {serviceDetail.map((s, i) => (
            <article key={s.slug} id={s.slug} className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="text-5xl font-bold text-gold">{String(i + 1).padStart(2, '0')}</p>
                <h2 className="mt-3 text-2xl font-bold text-navy">{s.name}</h2>
                <p className="mt-3 leading-relaxed text-gray-600">{s.lead}</p>
              </div>
              <div className="md:col-span-2">
                <div className="space-y-4 leading-relaxed text-gray-700">
                  {s.body.map((para) => <p key={para}>{para}</p>)}
                </div>
                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {s.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-cream py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">What to expect from MMD</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['Personal care', 'Help with daily living: bathing, dressing, grooming and toileting.'],
              ['Companionship', 'Activities that support social and emotional wellbeing.'],
              ['Respite care', 'Temporary relief for primary caregivers.'],
              ['Medical coordination', 'Appointments coordinated and medication reminders given.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl bg-white p-6 shadow-sm">
                <h3 className="font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">How our staff are vetted</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-gray-700">
            Every Direct Support Professional completes our full onboarding process before they
            work with a client.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onboardingChecks.map((c) => (
              <li key={c} className="flex items-start gap-2.5 rounded-lg bg-cream p-4">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                <span className="text-sm text-gray-700">{c}</span>
              </li>
            ))}
          </ul>
          <Link href="/contact" className="mt-10 inline-block rounded-lg bg-navy px-8 py-4 font-bold text-white hover:bg-navy-dark">
            Book a free consultation
          </Link>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
