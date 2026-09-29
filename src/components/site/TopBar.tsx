import { Phone, ShieldCheck } from 'lucide-react';
import { site } from '@/lib/site';

export default function TopBar() {
  return (
    <div className="bg-navy-deep text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-2 text-xs sm:px-8 sm:text-sm lg:px-12">
        <a href={site.phoneHref} className="flex items-center gap-1.5 font-medium hover:text-gold">
          <Phone className="h-3.5 w-3.5" />
          {site.phone}
        </a>
        <span className="flex items-center gap-1.5 font-semibold text-gold">
          <ShieldCheck className="h-3.5 w-3.5" />
          NJ DDD Approved Statewide Provider
        </span>
      </div>
    </div>
  );
}
