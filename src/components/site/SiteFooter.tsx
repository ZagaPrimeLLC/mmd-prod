import Link from 'next/link';
import { site } from '@/lib/site';
import NewsletterSignup from '@/components/site/NewsletterSignup';

const LINKS = [
  { href: '/services/home-health-aide', label: 'Home Health Aide Services' },
  { href: '/services/community-based-supports', label: 'Community-Based Supports' },
  { href: '/services/individual-supports', label: 'Individual Supports' },
  { href: '/services/respite', label: 'Respite' },
  { href: '/getting-started', label: 'Getting started with DDD' },
  { href: '/areas', label: 'Areas we serve' },
  { href: '/about', label: 'About us' },
  { href: '/mission', label: 'Mission and values' },
  { href: '/careers', label: 'DSP jobs' },
  { href: '/contact?cta=footer', label: 'Book a consultation' },
];

const LEGAL = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/notice-of-privacy-practices', label: 'Notice of Privacy Practices' },
  { href: '/nondiscrimination', label: 'Nondiscrimination and Language Assistance' },
  { href: '/accessibility', label: 'Accessibility' },
  { href: '/terms', label: 'Terms of Use' },
];

export default function SiteFooter() {
  return (
    <footer className="bg-navy-deep text-paper">
      <div className="grid gap-12 px-6 pb-10 pt-16 sm:px-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <p className="max-w-[34ch] text-2xl font-light leading-[1.25] tracking-[-0.03em]">
            {site.legalName}. Home care and developmental disability support in New Jersey.
          </p>
          <p className="mt-6 text-lg leading-relaxed text-paper/85">
            <Link href="/contact" className="underline decoration-gold decoration-2 underline-offset-4 hover:decoration-paper">Contact us</Link>
            <br />
            <a href={site.phoneHref} className="hover:underline hover:underline-offset-4">{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`} className="hover:underline hover:underline-offset-4">{site.email}</a>
          </p>
        </div>
        <div className="space-y-10">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[16px] text-paper/85">
            {LINKS.map((l) => (
              <li key={l.href}><Link href={l.href} className="hover:text-paper hover:underline hover:underline-offset-4">{l.label}</Link></li>
            ))}
          </ul>
          <NewsletterSignup />
        </div>
      </div>

      <div className="px-6 pb-10 sm:px-12">
        <p className="text-[15px] leading-relaxed text-paper/85">
          Images and videos on this website are illustrations.
        </p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] text-paper/70">
          {LEGAL.map((l) => (
            <li key={l.href}><Link href={l.href} className="hover:text-paper">{l.label}</Link></li>
          ))}
          <li>&copy; {new Date().getFullYear()} {site.legalName}</li>
        </ul>
      </div>
    </footer>
  );
}
