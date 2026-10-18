'use client';

import { useEffect, useRef } from 'react';

/**
 * A muted background loop that only plays while it is on screen, the tab is
 * visible and the visitor has not asked for reduced motion. The poster is the
 * picture everyone else sees.
 */
export default function LoopVideo({ src, poster, className = '', label }: { src: string; poster: string; className?: string; label?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => {
      if (reduce.matches || document.hidden || !visible) v.pause();
      else v.play().catch(() => {});
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.15 });
    io.observe(v);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', sync);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); reduce.removeEventListener('change', sync); };
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
