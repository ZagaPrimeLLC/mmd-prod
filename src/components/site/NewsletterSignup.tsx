'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@vercel/analytics';
import { getAttribution } from '@/lib/attribution';

export default function NewsletterSignup() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '').trim();
    if (!email) { setBusy(false); setError('Please add your email address.'); return; }

    const { error: err } = await createClient()
      .from('newsletter_subscribers')
      .insert({ email, attribution: getAttribution() });

    setBusy(false);
    if (err) {
      // Already on the list is not a failure worth alarming anyone about.
      if (err.message.toLowerCase().includes('duplicate')) setDone(true);
      else setError('That did not go through. Please try again later.');
    } else {
      setDone(true);
      track('newsletter_signup');
    }
  }

  if (done) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-white/10 p-3.5 text-sm text-gray-100">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        You are on the list. We will only send occasional updates about our services and openings.
      </p>
    );
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="nl-email" className="block text-sm font-medium text-gray-200">
        Occasional updates on services and job openings
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="nl-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-navy hover:bg-gold-dark disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Join
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-red-300">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{error}
        </p>
      )}
      <p className="mt-2 text-xs text-gray-400">
        No health information, ever. Unsubscribe any time.{' '}
        <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
      </p>
    </form>
  );
}
