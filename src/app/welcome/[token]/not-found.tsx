import Image from 'next/image';
import { Phone } from 'lucide-react';
import { site } from '@/lib/site';

export default function WelcomeNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-cream px-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid w-fit place-items-center rounded-lg bg-white p-1">
          <Image src={site.logo} alt="" width={616} height={484} className="h-14 w-auto" />
        </span>
        <h1 className="mt-6 text-xl font-bold text-navy-deep">This link is not working</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          It may have expired, or the office may have issued you a newer one. Give us a call and we
          will send you a fresh link straight away.
        </p>
        <a
          href={site.phoneHref}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy hover:bg-gold-dark"
        >
          <Phone className="h-4 w-4" /> {site.phone}
        </a>
      </div>
    </main>
  );
}
