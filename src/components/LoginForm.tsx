'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { safeNext } from '@/lib/safe-next';

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error') === 'link_expired' ? 'That sign-in link has expired or was already used. Request a new one.' : null
  );

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const next = safeNext(params.get('next'));
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Team accounts are provisioned by an admin; the login page must not create users on the shared host.
        shouldCreateUser: false,
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) {
      setError(
        /signups? not allowed/i.test(error.message)
          ? 'This email is not set up for team access. Ask an admin to add you.'
          : error.message
      );
    } else setSent(true);
  }

  if (sent) {
    return (
      <p className="mt-6 rounded-md bg-tint p-4 text-sm leading-relaxed">
        Check <strong>{email}</strong> for a sign-in link. It opens straight into the board.
      </p>
    );
  }

  return (
    <form onSubmit={signIn} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Work email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-3"
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-navy px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
