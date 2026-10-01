'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Phone, ChevronDown } from 'lucide-react';
import { site } from '@/lib/site';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/mission', label: 'Mission' },
  { href: '/services', label: 'Services' },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact', children: [{ href: '/contact/testimonials', label: 'Testimonials' }] },
] satisfies { href: string; label: string; children?: { href: string; label: string }[] }[];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-8 lg:px-12">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          {/* white plate keeps the shield's fine detail legible at small sizes */}
          <span className="grid shrink-0 place-items-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-100">
            <Image
              src={site.logo}
              alt={`${site.legalName} logo`}
              width={616}
              height={484}
              priority
              quality={100}
              className="h-12 w-auto sm:h-16"
            />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-[15px] font-extrabold leading-snug tracking-tight text-navy sm:text-xl">
              MMD Community Care
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-gold-deep [text-wrap:balance] sm:text-xs">
              {site.slogan}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 xl:flex">
          {nav.map((n) =>
            n.children ? (
              <div key={n.href} className="group relative">
                <Link href={n.href} className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-navy">
                  {n.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Link>
                <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="min-w-[13rem] rounded-lg border border-gray-100 bg-white py-2 shadow-lg">
                    {n.children.map((c) => (
                      <Link key={c.href} href={c.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-cream hover:text-navy">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link key={n.href} href={n.href} className="text-sm font-medium text-gray-700 hover:text-navy">
                {n.label}
              </Link>
            )
          )}
        </nav>

        <a
          href={site.phoneHref}
          className="hidden shrink-0 items-center gap-2 rounded-lg bg-gold px-5 py-2.5 font-bold text-navy hover:bg-gold-dark xl:inline-flex"
        >
          <Phone className="h-4 w-4" />
          {site.phone}
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="shrink-0 rounded-md p-2 text-navy xl:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white xl:hidden">
          <div className="mx-auto w-full max-w-7xl px-5 py-2 sm:px-8">
            {nav.map((n) => (
              <div key={n.href} className="border-b border-gray-100">
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-3.5 font-medium text-gray-700">
                  {n.label}
                </Link>
                {n.children?.map((c) => (
                  <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="block py-3 pl-5 text-sm text-gray-600">
                    {c.label}
                  </Link>
                ))}
              </div>
            ))}
            <a href={site.phoneHref} className="my-4 block rounded-lg bg-gold px-5 py-3.5 text-center font-bold text-navy">
              Call {site.phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
