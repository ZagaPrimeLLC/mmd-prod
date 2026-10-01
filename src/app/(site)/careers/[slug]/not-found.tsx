import Link from 'next/link';
import { site } from '@/lib/site';

export default function JobNotFound() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-xl px-5 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-gold-deep">Careers</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">This position is no longer open</h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          It may have been filled or closed. We hire across New Jersey all the time, so have a look at what is open now.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/careers#openings" className="rounded-lg bg-gold px-6 py-3 font-bold text-navy hover:bg-gold-dark">
            See open positions
          </Link>
          <a href={site.phoneHref} className="rounded-lg border-2 border-navy px-6 py-3 font-semibold text-navy hover:bg-navy hover:text-white">
            Call {site.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
