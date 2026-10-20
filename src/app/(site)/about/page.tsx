import Link from 'next/link';
import { PHOTOS } from '@/lib/photos';
import type { Metadata } from 'next';
import Image from 'next/image';
import PageHero from '@/components/site/PageHero';
import TrustBadges from '@/components/site/TrustBadges';
import CTABanner from '@/components/site/CTABanner';
import { values } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About us',
  description:
    'Get to know MMD Community Care: Home Health Aide Services for adults and seniors, and NJ DDD support for adults with developmental disabilities.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'About', href: '/about' }]}
        title="Care built around the person, not the paperwork"
        lead="We provide Home Health Aide Services for adults and seniors, alongside statewide NJ DDD Community-Based Supports, Individual Supports and Respite."
        photo={PHOTOS['about-listening']}
      />

      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:px-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-navy md:text-3xl">Who we are</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-navy-deep">
              <p>
                MMD Community Care brings together home care for adults and seniors and support for adults with developmental disabilities in New Jersey.
                Our clients are our top priority, and we believe in treating every individual with
                respect, dignity and kindness.
              </p>
              <p>
                Care is personal. We work with each client and their family to build a plan around
                what that person actually needs and wants: the routine that works, the goals worth
                pushing for, and the independence worth protecting.
              </p>
              <p>
                Our team is made up of highly competent, compassionate and dedicated professionals,
                and we work to help every member of that team reach their full potential.
              </p>
            </div>
          </div>
          <Image
            src={PHOTOS['about-teamwork'].src}
            alt={PHOTOS['about-teamwork'].alt}
            width={PHOTOS['about-teamwork'].width}
            height={PHOTOS['about-teamwork'].height}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="w-full rounded-[20px]"
          />
        </div>
      </section>

      <TrustBadges />

      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">Our values</h2>
          <dl className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {values.map(([name, detail]) => (
              <div key={name} className="rounded-[20px] bg-cream px-6 py-6">
                <dt className="font-normal text-navy-deep">{name}</dt>
                <dd className="mt-2 leading-relaxed text-navy-deep">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-[20px] bg-navy-deep py-14 text-paper">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 className="text-2xl font-bold">People you can feel confident in</h2>
          <p className="mt-4 text-paper">
            Every Direct Support Professional is fingerprinted, background checked and screened against the Central Registry.
            Our team completes training with the Rutgers University Boggs Center and holds CPR and First Aid certification before the first visit.
          </p>
          <p className="mt-2 text-paper">
            <Link href="/contact#book" className="underline decoration-gold decoration-2 underline-offset-4">Talk to us about your support needs</Link>.
          </p>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
