'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { site } from '@/lib/site';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={site.logo}
            alt={`${site.legalName} logo`}
            width={616}
            height={484}
            priority
            className="h-12 w-auto"
          />
          <span className="hidden leading-tight sm:block">
            <span className="block text-lg font-bold text-navy">MMD Community Care</span>
            <span className="block text-[11px] font-medium tracking-wide text-steel">{site.slogan}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-gray-700 hover:text-navy">
              {n.label}
            </Link>
          ))}
        </nav>

        <a
          href={site.phoneHref}
          className="hidden items-center gap-2 rounded-lg bg-gold px-5 py-2.5 font-bold text-navy hover:bg-gold-dark md:inline-flex"
        >
          <Phone className="h-4 w-4" />
          {site.phone}
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="rounded-md p-2 text-navy lg:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-2">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block border-b border-gray-100 py-3 font-medium text-gray-700"
              >
                {n.label}
              </Link>
            ))}
            <a href={site.phoneHref} className="mt-3 block rounded-lg bg-gold px-5 py-3 text-center font-bold text-navy">
              Call {site.phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
