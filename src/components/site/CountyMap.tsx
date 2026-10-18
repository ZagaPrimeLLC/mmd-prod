'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { NJ_COUNTIES, NJ_VIEWBOX } from '@/lib/nj-counties';

/**
 * New Jersey, county by county. When the map scrolls into view the counties
 * fill in from north to south; Middlesex, where the office is, fills in gold.
 * Counties with their own page link there; the rest link to contact.
 */
/** Where the office is: always filled in gold. */
const HOME = 'middlesex';

export default function CountyMap({ pages, highlight }: { pages: string[]; highlight?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('is-in'); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { el.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // North to south: the fill sweeps down the state.
  const order = [...NJ_COUNTIES].sort((a, b) => a.cy - b.cy).map((c) => c.slug);

  return (
    <svg
      ref={ref}
      viewBox={NJ_VIEWBOX}
      role="group"
      aria-labelledby="nj-map-title"
      className="mmd-map h-auto w-full max-w-[22rem]"
    >
      <title id="nj-map-title">{highlight
        ? `Map of New Jersey with ${NJ_COUNTIES.find((c) => c.slug === highlight)?.name ?? ''} County highlighted`
        : 'Map of New Jersey: MMD Community Care serves adults in every county in New Jersey'}</title>
      {NJ_COUNTIES.map((c) => {
        const href = pages.includes(c.slug) ? `/areas/${c.slug}` : `/contact?cta=map-${c.slug}`;
        const delay = order.indexOf(c.slug) * 55;
        return (
          <Link key={c.slug} href={href} className="mmd-county-link" aria-label={`${c.name} County`}>
            <path
              d={c.d}
              className={`mmd-county${c.slug === (highlight ?? HOME) ? ' is-home' : ''}`}
              style={{ '--mmd-delay': `${delay}ms` } as React.CSSProperties}
            />
          </Link>
        );
      })}
    </svg>
  );
}
