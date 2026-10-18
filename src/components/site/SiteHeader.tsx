'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { site } from '@/lib/site';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services', children: [
    { href: '/services/community-based-supports', label: 'Community-Based Supports' },
    { href: '/services/individual-supports', label: 'Individual Supports' },
    { href: '/services/respite', label: 'Respite' },
    { href: '/getting-started', label: 'Getting started with DDD' },
  ] },
  { href: '/areas', label: 'Areas we serve' },
  { href: '/about', label: 'About', children: [{ href: '/mission', label: 'Mission and values' }] },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact', children: [
    { href: site.officeHref, label: 'Visit the office' },
    { href: '/contact/testimonials', label: 'Share your experience' },
  ] },
] satisfies { href: string; label: string; children?: { href: string; label: string }[] }[];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-haze">
      <div className="flex h-[72px] w-full items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image src={site.logo} alt="" width={616} height={484} priority quality={100} className="h-11 w-auto" />
          <span className="text-lg font-medium tracking-[-0.02em] text-navy-deep sm:text-xl">MMD Community Care</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 xl:flex">
          {nav.map((n) => (
            <div key={n.href} className="group relative">
              <Link href={n.href} className="py-6 text-[16px] text-navy-deep underline-offset-[6px] hover:underline">
                {n.label}
              </Link>
              {n.children && (
                <div className="invisible absolute left-[-1.25rem] top-full z-50 translate-y-1 opacity-0 transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="min-w-[15rem] rounded-[20px] bg-paper py-3">
                    {n.children.map((c) => (
                      <Link key={c.href} href={c.href} className="block px-5 py-2 text-[16px] text-navy-deep hover:bg-cream">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <Link
          href="/contact?cta=header#book"
          data-cta="book-consultation"
          data-placement="header"
          className="hidden shrink-0 rounded-full bg-navy-deep px-6 py-3 text-[16px] font-medium text-paper transition hover:-translate-y-0.5 hover:bg-navy active:translate-y-0 xl:inline-flex"
        >
          Book a free consultation
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="shrink-0 rounded-full p-2 text-navy-deep xl:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav aria-label="Main" className="max-h-[calc(100svh-72px)] overflow-y-auto bg-haze px-3 pb-3 xl:hidden">
          <div className="rounded-[20px] bg-paper px-5 py-4">
            {nav.map((n) => (
              <div key={n.href} className="py-1">
                <Link href={n.href} onClick={() => setOpen(false)} className="block py-2.5 text-xl text-navy-deep">
                  {n.label}
                </Link>
                {n.children?.map((c) => (
                  <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="block py-2 pl-4 text-[16px] text-soft">
                    {c.label}
                  </Link>
                ))}
              </div>
            ))}
            <Link href="/contact?cta=mobile-header#book" data-cta="book-consultation" data-placement="mobile-header" onClick={() => setOpen(false)} className="mt-4 block rounded-full bg-navy-deep px-5 py-3.5 text-center font-medium text-paper">
              Book a free consultation
            </Link>
            <a href={site.phoneHref} className="mt-3 block py-2 text-center text-navy-deep underline underline-offset-4">
              Call {site.phone}
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
