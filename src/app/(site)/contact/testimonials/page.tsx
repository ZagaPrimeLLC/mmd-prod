import type { Metadata } from 'next';
import Link from 'next/link';
import { Quote } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CTABanner from '@/components/site/CTABanner';
import { testimonials, site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Testimonials',
  description:
    'What families, support coordinators and staff say about MMD Community Care in New Jersey.',
  alternates: { canonical: '/contact/testimonials' },
};

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Testimonials"
        title="What families tell us"
        lead="The families we support, the coordinators who refer to us, and the people who work here."
        image="/images/community-walk.png"
        imageAlt="An MMD support worker accompanying a client in the community"
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={i} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
                <Quote className="h-8 w-8 shrink-0 text-gold" />
                <blockquote className="mt-5 flex-1 leading-relaxed text-gray-700">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-gray-100 pt-4">
                  <span className="block font-bold text-navy">{t.name}</span>
                  <span className="block text-sm text-gray-600">{t.role}</span>
                  <span className="mt-2 inline-block rounded bg-cream px-2 py-1 text-xs font-medium text-steel">
                    {t.service}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-14 rounded-2xl bg-cream p-8">
            <h2 className="text-xl font-bold text-navy">Would you share your experience?</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-gray-700">
              If MMD supports your family and you would be happy for us to publish a few words, we
              would be glad to hear from you. Nothing goes on this page without written permission.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-lg bg-navy px-6 py-3 font-bold text-white hover:bg-navy-dark">
                Get in touch
              </Link>
              <a href={site.phoneHref} className="rounded-lg border-2 border-navy px-6 py-3 font-semibold text-navy hover:bg-navy hover:text-white">
                Call {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
