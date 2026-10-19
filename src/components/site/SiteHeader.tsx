'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, Phone } from 'lucide-react';
import { site } from '@/lib/site';

type NavItem = {
  href: string;
  label: string;
  introduction?: string;
  children?: { href: string; label: string; description: string }[];
};

const nav: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services', introduction: 'Support for your kind of everyday.', children: [
    { href: '/services/home-health-aide', label: 'Home Health Aide Services', description: 'Personal care and companionship at home.' },
    { href: '/services/community-based-supports', label: 'Community-Based Supports', description: 'More connection, out in the community.' },
    { href: '/services/individual-supports', label: 'Individual Supports', description: 'A helping hand with everyday routines.' },
    { href: '/services/respite', label: 'Respite', description: 'Time to recharge for family caregivers.' },
    { href: '/getting-started', label: 'Getting started with DDD', description: 'Understand the next steps, together.' },
  ] },
  { href: '/areas', label: 'Areas we serve' },
  { href: '/about', label: 'About', introduction: 'People first. Always.', children: [
    { href: '/mission', label: 'Mission and values', description: 'What guides the way we care.' },
  ] },
  { href: '/careers', label: 'Careers' },
  { href: '/contact', label: 'Contact', introduction: 'A conversation is a good place to start.', children: [
    { href: site.officeHref, label: 'Visit the office', description: 'Find visiting information on our Contact page.' },
    { href: '/contact/testimonials', label: 'Share your experience', description: 'Tell us about your experience with MMD.' },
  ] },
];

function RollingLabel({ children }: { children: string }) {
  return (
    <span className="mmd-nav-label">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const header = useRef<HTMLElement>(null);
  const mobileToggle = useRef<HTMLButtonElement>(null);
  const menuToggles = useRef<Record<string, HTMLButtonElement | null>>({});

  const close = () => { setOpen(false); setMenu(null); };
  const active = (item: NavItem) => pathname === item.href ||
    (item.href !== '/' && pathname.startsWith(item.href + '/')) ||
    Boolean(item.children?.some((child) => pathname === child.href.split('#')[0]));

  useEffect(() => {
    if (!open && !menu) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setOpen(false); setMenu(null);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open, menu]);

  return (
    <header ref={header} className="mmd-header" onKeyDown={(event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (open) { setOpen(false); mobileToggle.current?.focus(); }
      else if (menu) { menuToggles.current[menu]?.focus(); setMenu(null); }
    }}>
      <div className="mmd-header-shell bg-navy-deep text-paper">
        <div className="mmd-header-row">
          <Link href="/" aria-label="MMD Community Care home" onClick={close} className="mmd-header-brand">
            <span className="mmd-header-crest">
              <Image src={site.logo} alt="" width={616} height={484} priority quality={100} className="h-auto w-[58px]" />
            </span>
            <span className="mmd-header-wordmark"><strong>MMD</strong><span>Community Care</span></span>
          </Link>

          <nav aria-label="Main" className="mmd-desktop-nav">
            {nav.map((item) => (
              <div key={item.href} className="mmd-nav-item" data-active={active(item)} data-open={menu === item.href}
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setMenu(item.children ? item.href : null); }}
                onPointerLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) setMenu(null); }}
                onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenu(null); }}>
                <div className="mmd-nav-trigger">
                  <Link href={item.href} aria-current={pathname === item.href ? 'page' : undefined} onClick={close}
                    onFocus={() => setMenu(item.children ? item.href : null)} className="mmd-nav-link">
                    <RollingLabel>{item.label}</RollingLabel>
                  </Link>
                  {item.children && <button type="button" ref={(node) => { menuToggles.current[item.href] = node; }}
                    aria-label={item.label + ' submenu'} aria-expanded={menu === item.href} aria-controls={'nav-' + item.label.toLowerCase()}
                    onClick={() => setMenu((current) => current === item.href ? null : item.href)} className="mmd-nav-toggle">
                    <ChevronDown aria-hidden="true" size={13} />
                  </button>}
                </div>
                {item.children && (
                  <div id={'nav-' + item.label.toLowerCase()} hidden={menu !== item.href}
                    className={'mmd-nav-panel' + (item.href === '/services' ? ' mmd-nav-panel-wide' : '')}>
                    <div className="mmd-nav-panel-inner">
                      <p className="mmd-nav-introduction">{item.introduction}</p>
                      <div className="mmd-nav-destinations">
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href} onClick={close} className="mmd-nav-destination">
                            <span><strong>{child.label}</strong><span>{child.description}</span></span>
                            <ArrowUpRight aria-hidden="true" size={19} />
                          </Link>
                        ))}
                      </div>
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
            className="mmd-header-cta"
          >
            <span><span>Let’s talk.</span><span>Book a free consultation</span></span>
            <span className="mmd-header-cta-arrow"><ArrowUpRight aria-hidden="true" size={24} /></span>
          </Link>

          <button ref={mobileToggle} type="button" onClick={() => { setOpen((value) => !value); setMenu(null); }}
            aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-navigation"
            className="mmd-mobile-toggle" data-open={open}>
            <span>{open ? 'Close' : 'Menu'}</span><span className="mmd-menu-lines" aria-hidden="true"><span /><span /></span>
          </button>
        </div>

        {open && (
          <nav id="mobile-navigation" aria-label="Main" className="mmd-mobile-nav">
            <div className="mmd-mobile-links">
              {nav.map((item) => (
                <div key={item.href}>
                  <Link href={item.href} onClick={close} aria-current={pathname === item.href ? 'page' : undefined} className="mmd-mobile-link" data-active={active(item)}>
                    {item.label}<ArrowUpRight aria-hidden="true" size={23} />
                  </Link>
                  {item.children && <div className="mmd-mobile-children">{item.children.map((child) => (
                    <Link key={child.href} href={child.href} onClick={close}>{child.label}</Link>
                  ))}</div>}
                </div>
              ))}
            </div>
            <div className="mmd-mobile-actions">
              <Link href="/contact?cta=mobile-header#book" data-cta="book-consultation" data-placement="mobile-header" onClick={close} className="mmd-mobile-booking">
                Book a free consultation<ArrowUpRight aria-hidden="true" size={21} />
              </Link>
              <a href={site.phoneHref} className="mmd-mobile-phone"><Phone aria-hidden="true" size={16} />Call {site.phone}</a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
