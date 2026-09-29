import type { Metadata } from 'next';
import Image from 'next/image';
import PageHero from '@/components/site/PageHero';
import TrustBadges from '@/components/site/TrustBadges';
import CTABanner from '@/components/site/CTABanner';
import { site, values } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About us',
  description:
    'MMD Community Care is a New Jersey DDD approved statewide provider serving adults with special needs across New Jersey from our South Plainfield office.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About MMD"
        title="Care built around the person, not the paperwork"
        lead="We are a New Jersey DDD approved statewide provider of community support, respite and individual support for adults with disabilities."
        image="/images/kitchen.jpg"
        imageAlt="An MMD support worker and a client preparing a meal together at home"
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:px-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-navy md:text-3xl">Who we are</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-gray-700">
              <p>
                MMD Community Care supports adults with developmental disabilities across New Jersey.
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
            src="/images/kitchen.jpg"
            alt="An MMD support worker and a client preparing a meal together"
            width={1200}
            height={900}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="rounded-2xl shadow-lg"
          />
        </div>
      </section>

      <TrustBadges />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">Our values</h2>
          <dl className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {values.map(([name, detail]) => (
              <div key={name} className="border-l-4 border-gold pl-5">
                <dt className="font-bold text-navy">{name}</dt>
                <dd className="mt-2 leading-relaxed text-gray-600">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-navy py-14 text-white">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 className="text-2xl font-bold">Where to find us</h2>
          <p className="mt-4 text-gray-100">
            {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
          </p>
          <p className="mt-2 text-gray-100">
            Walk-in hours for applications and paperwork: <strong className="text-gold">{site.walkIn}</strong>
          </p>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
