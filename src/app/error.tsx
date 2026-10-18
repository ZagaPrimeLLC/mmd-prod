'use client';

import { useEffect } from 'react';
import { site } from '@/lib/site';

/**
 * Shown when a page fails to render (for example the database is briefly
 * unreachable and nothing is cached). Families must always be able to reach
 * the office, so the phone number and address are part of the error itself.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('page error', error.digest ?? error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6 py-16 text-navy-deep">
      <h1 className="text-3xl font-semibold">This page is temporarily unavailable</h1>
      <p className="mt-4 text-lg leading-relaxed">
        Something went wrong on our side. You can try again, or reach the office directly.
      </p>
      <p className="mt-6 text-lg">
        Call <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>
        <br />
        {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 self-start rounded-full bg-navy-deep px-6 py-3 font-medium text-white hover:bg-navy"
      >
        Try again
      </button>
    </main>
  );
}
