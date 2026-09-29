'use client';

import { useState } from 'react';
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react';

function size(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Documents live in a private bucket. Clicking asks an edge function for a
 * download link that lasts a few minutes, so nothing here is a permanent
 * public URL that could be forwarded on.
 */
export default function DocumentLink({
  token, path, title, description, sizeBytes,
}: {
  token: string; path: string; title: string;
  description: string | null; sizeBytes: number | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mmd-onboarding-doc`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token, path }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json?.url) throw new Error('unavailable');
      window.location.href = json.url;
    } catch {
      setError('That file would not open. Please call the office and we will send it to you.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={open}
        disabled={busy}
        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-navy/30 hover:bg-white disabled:opacity-60"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy/10">
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-navy" /> : <FileText className="h-4 w-4 text-navy" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy-deep">{title}</span>
          {description && <span className="block truncate text-xs text-slate-500">{description}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-steel">
          {size(sizeBytes)}
          <Download className="h-4 w-4" />
        </span>
      </button>
      {error && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />{error}
        </p>
      )}
    </>
  );
}
