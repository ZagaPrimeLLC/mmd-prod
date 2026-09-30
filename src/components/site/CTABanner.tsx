import Link from 'next/link';
import { Phone } from 'lucide-react';
import { site } from '@/lib/site';

export default function CTABanner() {
  return (
    <section className="bg-cream py-20">
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 lg:px-12 text-center">
        <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">Ready to Get Started?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600">
          Book a free consultation to discuss how we can support your loved one.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href={site.phoneHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy px-8 py-4 text-lg font-semibold text-navy hover:bg-navy hover:text-white"
          >
            <Phone className="h-5 w-5" />
            Call {site.phone}
          </a>
          <Link
            href="/contact?cta=cta-banner#book"
            className="inline-flex items-center justify-center rounded-lg bg-gold px-8 py-4 text-lg font-bold text-navy shadow-lg hover:bg-gold-dark"
          >
            Book Consultation
          </Link>
        </div>
      </div>
    </section>
  );
}
