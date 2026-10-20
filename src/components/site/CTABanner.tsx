import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import { site } from '@/lib/site';

export default function CTABanner({ title = 'Talk to us about your family' }: { title?: string }) {
  return (
    <section data-track-slot="cta-film" className="relative mx-3 mt-3 overflow-hidden rounded-[20px] bg-navy-deep px-6 py-14 text-paper sm:px-12 md:py-20">
      <div className="relative grid items-end gap-10 lg:grid-cols-[1.25fr_1fr]">
        <Reveal>
          <h2 className="max-w-[18ch] text-[2.5rem] leading-[1.08] sm:text-[3.5rem]">{title}</h2>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-paper/90">A free consultation to talk through home care or DDD services and the next steps for your family, with no obligation.</p>
        </Reveal>
        <div className="flex flex-col items-start gap-6 lg:items-end">
          <Link href="/contact?cta=cta-film#book" data-cta="book-consultation" data-placement="cta-film" className="inline-flex items-center gap-5 rounded-full bg-gold-crest px-7 py-4 text-lg font-medium text-navy-deep transition hover:-translate-y-0.5 hover:bg-gold">
            Book a free consultation <ArrowUpRight aria-hidden className="h-5 w-5" />
          </Link>
          <a href={site.phoneHref} className="text-lg underline decoration-gold decoration-2 underline-offset-[6px]">Call {site.phone}</a>
        </div>
      </div>
    </section>
  );
}
