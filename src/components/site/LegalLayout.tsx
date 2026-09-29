import type { ReactNode } from 'react';
import Link from 'next/link';
import { site } from '@/lib/site';

export function Confirm({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-gold/20 px-1.5 py-0.5 font-semibold text-navy ring-1 ring-gold/50">
      {children}
    </span>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-xl font-bold text-navy md:text-2xl">{heading}</h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export default function LegalLayout({
  title,
  intro,
  effective,
  children,
}: {
  title: string;
  intro?: string;
  effective: string;
  children: ReactNode;
}) {
  return (
    <>
      <section className="bg-navy py-14 md:py-20">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8 lg:px-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            {site.legalName}
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {intro && <p className="mt-5 text-lg leading-relaxed text-gray-100">{intro}</p>}
          <p className="mt-6 text-sm text-gray-300">Effective {effective}</p>
        </div>
      </section>

      <div className="bg-white py-14 md:py-20">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8 lg:px-12">{children}</div>
      </div>

      <div className="border-t border-gray-100 bg-cream py-10">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8 lg:px-12">
          <p className="text-sm font-semibold text-navy">Questions about this notice</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            Call{' '}
            <a href={site.phoneHref} className="font-semibold text-navy underline">
              {site.phone}
            </a>
            , email{' '}
            <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">
              {site.email}
            </a>
            , or write to {site.address.street}, {site.address.city}, {site.address.state}{' '}
            {site.address.zip}.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            <Link href="/privacy" className="underline hover:text-navy">Privacy Policy</Link>
            {' · '}
            <Link href="/notice-of-privacy-practices" className="underline hover:text-navy">Notice of Privacy Practices</Link>
            {' · '}
            <Link href="/nondiscrimination" className="underline hover:text-navy">Nondiscrimination and Language Assistance</Link>
            {' · '}
            <Link href="/accessibility" className="underline hover:text-navy">Accessibility</Link>
            {' · '}
            <Link href="/terms" className="underline hover:text-navy">Terms of Use</Link>
          </p>
        </div>
      </div>
    </>
  );
}
