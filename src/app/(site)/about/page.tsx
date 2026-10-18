import Link from 'next/link';
import { PHOTOS } from '@/lib/photos';
import { getSchedule } from '@/lib/cms/read';
import { officeHoursLabel } from '@/lib/booking';
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

export default async function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'About', href: '/about' }]}
        title="Care built around the person, not the paperwork"
        lead="We are a New Jersey DDD approved statewide provider of community support, respite and individual support for adults with disabilities."
        photo={PHOTOS.kitchen}
      />

      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:px-12 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-navy md:text-3xl">Who we are</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-navy-deep">
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
            src={PHOTOS.library.src}
            alt={PHOTOS.library.alt}
            width={PHOTOS.library.width}
            height={PHOTOS.library.height}
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
          <h2 className="text-2xl font-bold">Where to find us</h2>
          <p className="mt-4 text-paper">
            <Link href={site.officeHref} className="underline decoration-gold decoration-2 underline-offset-4">
              {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
            </Link>
          </p>
          <p className="mt-2 text-paper">
            Walk-in hours for applications and paperwork: <strong className="text-gold">{officeHoursLabel(await getSchedule())}</strong>
          </p>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
