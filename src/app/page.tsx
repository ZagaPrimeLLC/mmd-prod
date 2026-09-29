import type { Metadata } from 'next';
import Link from 'next/link';
import { site, services } from '@/lib/site';

export const metadata: Metadata = {
  title: `${site.name} | ${site.tagline}`,
  description: site.description,
  alternates: { canonical: '/' },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: site.legalName,
  description: site.description,
  telephone: site.phone,
  email: site.email,
  areaServed: { '@type': 'State', name: 'New Jersey' },
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    postalCode: site.address.zip,
    addressCountry: 'US',
  },
};

export default function HomePage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <span className="text-lg font-semibold tracking-wide">MMD COMMUNITY CARE</span>
          <a href={site.phoneHref} className="rounded-md bg-gold px-4 py-2 font-semibold text-navy-deep">
            Call {site.phone}
          </a>
        </div>
        <div className="border-t border-white/15 bg-navy-deep">
          <p className="mx-auto max-w-5xl px-4 py-2 text-sm text-gold-bright">
            New Jersey DDD approved statewide provider
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h1 className="text-4xl font-bold text-navy sm:text-5xl">{site.tagline}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed">
          We provide a high standard of community support, Respite and Individual Support to adults
          with disabilities &mdash; maintaining your dignity and enabling you to live safely and
          comfortably at home or out in the community.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/contact" className="rounded-md bg-navy px-6 py-3 font-semibold text-white">
            Book a free consultation
          </Link>
          <Link href="/services" className="rounded-md border-2 border-navy px-6 py-3 font-semibold text-navy">
            Our services
          </Link>
        </div>
      </section>

      <section className="bg-tint py-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy">Our services</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {services.map((s) => (
              <article key={s.slug} className="rounded-lg border-t-4 border-gold bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-navy">{s.name}</h3>
                <p className="mt-3 text-sm leading-relaxed">{s.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-navy-deep py-10 text-white">
        <div className="mx-auto max-w-5xl px-4 text-sm">
          <p className="font-semibold">{site.legalName}</p>
          <p className="mt-2 text-white/80">
            {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
          </p>
          <p className="mt-1 text-white/80">
            <a href={site.phoneHref}>{site.phone}</a> &middot;{' '}
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <p className="mt-6 text-white/60">
            &copy; {new Date().getFullYear()} {site.legalName}
          </p>
        </div>
      </footer>
    </main>
  );
}
