import type { Metadata } from 'next';
import { PHOTOS } from '@/lib/photos';
import { Heart } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CTABanner from '@/components/site/CTABanner';
import { values } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Mission and vision',
  description:
    'Why we do what we do. The mission of MMD Community Care is to improve the quality of life for our special needs clients daily.',
  alternates: { canonical: '/mission' },
};

export default function MissionPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Mission and values', href: '/mission' }]}
        title="Why we do what we do"
        lead="We believe in treating our clients with compassion and respect."
        photo={PHOTOS['home-care-companionship']}
      />

      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-16 md:py-20">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8 lg:px-12">
          <Heart className="h-10 w-10 text-gold" />
          <p className="mt-6 text-lg leading-relaxed text-navy-deep md:text-xl">
            At MMD Community Care, we believe in treating our clients with compassion and respect.
            We understand that individuals with special needs require a different kind of care, one
            that is based on understanding, patience, and empathy. That is why we are committed to
            providing compassionate care that is focused on our clients&apos; well-being, both
            physical and emotional.
          </p>
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-[20px] bg-cream py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-2 lg:px-12">
          <article className="rounded-[20px] bg-paper p-8">
            <h2 className="text-[2.2rem] text-navy-deep">Mission</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-deep">
              The mission of MMD Community Care is to improve the quality of life for our special
              needs clients daily.
            </p>
          </article>

          <article className="rounded-[20px] bg-paper p-8">
            <h2 className="text-[2.2rem] text-navy-deep">Vision</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-deep">
              We are committed to delivering the highest standards of care to our clients by
              ensuring that they live a fulfilled life. Fulfillment is instilled in our values of
              compassionate caring and teamwork.
            </p>
          </article>
        </div>
      </section>

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

      <CTABanner />
    </>
  );
}
