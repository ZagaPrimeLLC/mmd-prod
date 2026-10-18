'use client';

import { site } from '@/lib/site';

/**
 * Last-resort page when the root layout itself fails. It replaces the whole
 * document, so it brings its own <html> and plain inline styles.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', color: '#16224A', background: '#F4F6FB' }}>
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>{site.name} is temporarily unavailable</h1>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>Please try again in a moment, or reach the office directly.</p>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>
            Call <a href={site.phoneHref} style={{ color: '#16224A', fontWeight: 600 }}>{site.phone}</a>
            <br />
            {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: '12px 24px', borderRadius: 999, border: 0, background: '#16224A', color: '#fff', fontSize: 16, cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
