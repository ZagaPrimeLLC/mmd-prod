'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const next = params.get('next') ?? '/dashboard';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
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
