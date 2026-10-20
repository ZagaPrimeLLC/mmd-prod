import type { Metadata } from 'next';
import { PHOTOS } from '@/lib/photos';
import Link from 'next/link';
import { Phone } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CTABanner from '@/components/site/CTABanner';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Share Your Experience',
  description: 'Families, support coordinators and staff: tell us about your experience with MMD Community Care.',
  alternates: { canonical: '/contact/testimonials' },
};

/**
 * Real words only. Until MMD has permissioned reviews (and the Google Business
 * Profile reviews feature is switched on), this page invites them instead of
 * showing any.
 */
export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Contact', href: '/contact' }, { name: 'Share your experience', href: '/contact/testimonials' }]}
        title="Tell us how we are doing"
        lead="Families, support coordinators and our own team: your experience helps us improve, and helps other families choose with confidence."
        photo={PHOTOS['feedback-conversation']}
      />
      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-20 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div className="max-w-xl space-y-5 text-lg leading-relaxed text-navy-deep">
            <h2 className="text-3xl text-navy-deep md:text-4xl">Your words, with your permission</h2>
            <p>
              If MMD supports your family, or you work with us, we would love to hear what is working and what
              could be better.
            </p>
            <p>
              We only ever publish a comment with written permission, using a first name and county unless you
              ask otherwise. We never share details about anyone’s support or health.
            </p>
          </div>
          <div className="rounded-[20px] bg-cream p-8">
            <h2 className="text-2xl text-navy-deep">Get in touch</h2>
            <p className="mt-3 leading-relaxed text-navy-deep">Send us a message or call the office. It takes a couple of minutes.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?cta=share-experience" className="inline-flex items-center justify-center rounded-full bg-navy px-7 py-3.5 font-bold text-white hover:bg-navy-dark">
                Send a message
              </Link>
              <a href={site.phoneHref} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-navy-deep bg-paper hover:bg-white">
                <Phone className="h-4 w-4" /> {site.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
      <CTABanner />
    </>
  );
}
