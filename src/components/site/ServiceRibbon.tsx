'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';

/** One readable list, plus an inaccessible visual copy for the seamless loop. */
export default function ServiceRibbon({ items }: { items: string[] }) {
  const [paused, setPaused] = useState(false);

  return (
    <section aria-label="MMD services at a glance" data-track-slot="home.ribbon" data-paused={paused} className="mmd-ribbon bg-navy-deep text-paper">
      <div className="mmd-ribbon-viewport" tabIndex={0} aria-label="Service highlights; focus to pause scrolling">
        <div className="mmd-ribbon-track">
          {[false, true].map((copy) => (
            <ul key={String(copy)} aria-hidden={copy || undefined} className={`mmd-ribbon-group${copy ? ' mmd-ribbon-copy' : ''}`}>
              {items.map((item, index) => (
                <li key={`${index}-${item}`} className="flex shrink-0 items-center gap-8 sm:gap-12">
                  <span>{item}</span>
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-crest" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <button type="button" aria-label={paused ? 'Play information banner' : 'Pause information banner'} aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
        className="mmd-ribbon-control grid h-12 w-12 shrink-0 place-items-center rounded-full border border-paper/25 transition hover:bg-paper/10">
        {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
      </button>
    </section>
  );
}
