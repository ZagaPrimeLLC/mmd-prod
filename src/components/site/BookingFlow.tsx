'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { availableSlots, groupByDay, type Slot } from '@/lib/booking';
import { site } from '@/lib/site';
import FormPrivacyNote from '@/components/site/FormPrivacyNote';

export default function BookingFlow() {
  const days = useMemo(() => groupByDay(availableSlots()), []);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slot) return;
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from('bookings').insert({
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
      requested_slot: slot.iso,
      notes: String(fd.get('notes') ?? '').trim() || null,
    });

    setBusy(false);
    if (error) setError(`We could not hold that time. Please call ${site.phone}.`);
    else setDone(true);
  }

  if (done && slot) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-7">
        <CheckCircle2 className="mb-3 h-8 w-8 text-green-700" />
        <h3 className="text-xl font-bold text-green-900">Consultation requested</h3>
        <p className="mt-3 text-green-900">
          <strong>{slot.dayLabel} at {slot.timeLabel}</strong>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-green-900">
          This is a request, not a confirmed booking. The office will call you to confirm the time
          before it is final. If you need to change it, call{' '}
          <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>.
        </p>
      </div>
    );
  }

  if (!slot) {
    return (
      <div>
        <p className="flex items-center gap-2 font-semibold text-navy">
          <CalendarCheck className="h-5 w-5 text-steel" />
          Pick a time that suits you
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Consultations run during our office hours, Tuesdays and Thursdays between 11am and 4pm.
          Each one is about {45} minutes.
        </p>

        {days.length === 0 ? (
          <p className="mt-6 rounded-lg bg-cream p-4 text-sm text-gray-700">
            No times are open in the next few weeks. Please call{' '}
            <a href={site.phoneHref} className="font-semibold text-navy underline">{site.phone}</a>.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {days.map((d) => (
              <div key={d.day}>
                <p className="text-sm font-bold text-navy">{d.day}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {d.slots.map((s) => (
                    <button
                      key={s.iso}
                      type="button"
                      onClick={() => setSlot(s)}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-navy hover:border-navy hover:bg-navy hover:text-white"
                    >
                      {s.timeLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={confirm} className="space-y-5">
      <button
        type="button"
        onClick={() => setSlot(null)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" /> Choose a different time
      </button>

      <div className="rounded-xl bg-cream p-4">
        <p className="text-sm text-gray-600">You are requesting</p>
        <p className="font-bold text-navy">{slot.dayLabel} at {slot.timeLabel}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="b-name" className="block text-sm font-semibold text-gray-800">Your name</label>
          <input id="b-name" name="name" required autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
        <div>
          <label htmlFor="b-phone" className="block text-sm font-semibold text-gray-800">Phone</label>
          <input id="b-phone" name="phone" type="tel" required autoComplete="tel"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
      </div>

      <div>
        <label htmlFor="b-email" className="block text-sm font-semibold text-gray-800">Email</label>
        <input id="b-email" name="email" type="email" required autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
      </div>

      <div>
        <label htmlFor="b-notes" className="block text-sm font-semibold text-gray-800">
          Anything we should know before the call? <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea id="b-notes" name="notes" rows={3} maxLength={800}
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        <p className="mt-1.5 text-xs text-gray-500">
          Please keep medical details out of this box. We will go through anything clinical on the call.
        </p>
      </div>

      <FormPrivacyNote />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </p>
      )}

      <button type="submit" disabled={busy}
        className="rounded-lg bg-gold px-8 py-3.5 font-bold text-navy hover:bg-gold-dark disabled:opacity-60">
        {busy ? 'Requesting…' : 'Request this time'}
      </button>
    </form>
  );
}
