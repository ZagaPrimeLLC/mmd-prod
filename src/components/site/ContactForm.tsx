'use client';

import { useState } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { site, services } from '@/lib/site';

export default function ContactForm({ sourcePage = '/contact' }: { sourcePage?: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim() || null,
      phone: String(fd.get('phone') ?? '').trim() || null,
      service_interested: String(fd.get('service') ?? '') || null,
      message: String(fd.get('message') ?? '').trim() || null,
      source_page: sourcePage,
    };

    if (!payload.email && !payload.phone) {
      setBusy(false);
      setError('Please give us either an email address or a phone number so we can reply.');
      return;
    }

    const { error } = await createClient().from('inquiries').insert(payload);
    setBusy(false);
    if (error) setError(`We could not send that. Please call us on ${site.phone}.`);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <CheckCircle2 className="mb-3 h-7 w-7 text-green-700" />
        <h3 className="text-lg font-bold text-green-900">Thank you. We have your enquiry.</h3>
        <p className="mt-2 text-sm leading-relaxed text-green-900">
          Someone from our team will get back to you within one business day. If it is urgent,
          please call <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-gray-800">Your name</label>
          <input id="name" name="name" required autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">Phone</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-800">Email</label>
        <input id="email" name="email" type="email" autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        <p className="mt-1.5 text-xs text-gray-500">Give us a phone number or an email, whichever you prefer we use.</p>
      </div>

      <div>
        <label htmlFor="service" className="block text-sm font-semibold text-gray-800">What are you looking for?</label>
        <select id="service" name="service"
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy">
          <option value="">Not sure yet</option>
          {services.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          <option value="other">Something else</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-gray-800">How can we help?</label>
        <textarea id="message" name="message" rows={4} maxLength={1500}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        <p className="mt-1.5 text-xs text-gray-500">
          Please don&apos;t include medical details or diagnoses here. For anything clinical, call us
          on <a href={site.phoneHref} className="font-medium underline">{site.phone}</a>.
        </p>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy}
          className="rounded-lg bg-navy px-8 py-3.5 font-bold text-white hover:bg-navy-dark disabled:opacity-60">
          {busy ? 'Sending…' : 'Send enquiry'}
        </button>
        <a href={site.phoneHref} className="inline-flex items-center gap-2 font-semibold text-navy">
          <Phone className="h-4 w-4" /> or call {site.phone}
        </a>
      </div>
    </form>
  );
}
