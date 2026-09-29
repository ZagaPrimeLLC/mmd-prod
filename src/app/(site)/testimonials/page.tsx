import type { Metadata } from 'next';
import { Quote } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CTABanner from '@/components/site/CTABanner';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Testimonials',
  description: 'What families and support coordinators say about MMD Community Care.',
  alternates: { canonical: '/testimonials' },
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Testimonials"
        title="What families tell us"
        lead="We are collecting stories from the families and support coordinators we work with."
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Quote className="mx-auto h-12 w-12 text-gold" />
          <h2 className="mt-6 text-2xl font-bold text-navy">Testimonials are on the way</h2>
          <p className="mt-4 leading-relaxed text-gray-600">
            We are gathering written permission from families before publishing their words here,
            so that nobody&apos;s story goes up without their say-so.
          </p>
          <p className="mt-6 leading-relaxed text-gray-600">
            If MMD supports your family and you would be happy to share your experience, we would be
            glad to hear from you — call{' '}
            <a href={site.phoneHref} className="font-semibold text-navy underline">{site.phone}</a>{' '}
            or email{' '}
            <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">{site.email}</a>.
          </p>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
