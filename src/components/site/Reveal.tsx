'use client';

import { useEffect, useRef } from 'react';

/**
 * Settles its content into place the first time it scrolls into view.
 * CSS does the motion (.mmd-reveal in globals.css), so reduced-motion users and
 * anyone without JavaScript simply see the finished page.
 */
export default function Reveal({
  children, delay = 0, as: Tag = 'div', className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) return;
    // Include the viewport edges, not just the observer's smaller root. Even
    // partially visible content should stay still when hydration finishes.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    // The first callback reports the initial state. Anything already on
    // screen stays exactly as it is; only what scrolls in later gets the entrance.
    let initial = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (!initial) e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
        initial = false;
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`mmd-reveal ${className}`}
      style={delay ? ({ '--mmd-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
