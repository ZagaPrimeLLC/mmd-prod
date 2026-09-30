'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { CalendarCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { availableDays, SLOT_MINUTES, timeLabel } from '@/lib/booking';
import { site } from '@/lib/site';
import FormPrivacyNote from '@/components/site/FormPrivacyNote';

const field =
  'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy disabled:bg-gray-50 disabled:text-gray-400';

// True only in the browser. The page itself is built ahead of time, so the
// times are worked out when someone opens it, never frozen at build time.
const noop = () => () => {};
const useInBrowser = () => useSyncExternalStore(noop, () => true, () => false);

export default function BookingFlow() {
  const inBrowser = useInBrowser();
  const days = useMemo(() => (inBrowser ? availableDays() : []), [inBrowser]);
  const [dayKey, setDayKey] = useState('');
  const [slotIso, setSlotIso] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const day = days.find((d) => d.key === dayKey) ?? null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!day || !slotIso) {
      setError('Choose a day and a time.');
      return;
    }
    setBusy(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const { error } = await createClient().from('bookings').insert({
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim(),
      requested_slot: slotIso,
      notes: String(fd.get('notes') ?? '').trim() || null,
    });

    setBusy(false);
    if (error) setError(`We could not hold that time. Please call ${site.phone}.`);
    else setDone(`${day.label} at ${timeLabel(slotIso)}`);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-7">
        <CheckCircle2 className="mb-3 h-8 w-8 text-green-700" />
        <h3 className="text-xl font-bold text-green-900">Consultation requested</h3>
        <p className="mt-3 text-green-900"><strong>{done}</strong></p>
        <p className="mt-3 text-sm leading-relaxed text-green-900">
          This is a request, not a confirmed booking. The office will call you to confirm the time
          before it is final. If you need to change it, call{' '}
          <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <p className="flex items-center gap-2 font-semibold text-navy">
          <CalendarCheck className="h-5 w-5 text-steel" />
          Pick a time that suits you
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Tuesdays and Thursdays, 11am to 4pm. Each consultation is about {SLOT_MINUTES} minutes.
        </p>
      </div>

      {inBrowser && days.length === 0 ? (
        <p className="rounded-lg bg-cream p-4 text-sm text-gray-700">
          No times are open in the next few weeks. Please call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">{site.phone}</a>.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="b-day" className="block text-sm font-semibold text-gray-800">Day</label>
            <select
              id="b-day"
              required
              value={dayKey}
              disabled={!inBrowser}
              onChange={(e) => { setDayKey(e.target.value); setSlotIso(''); }}
              className={field}
            >
              <option value="">{inBrowser ? 'Choose a day' : 'Loading…'}</option>
              {days.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-time" className="block text-sm font-semibold text-gray-800">Time</label>
            <select
              id="b-time"
              required
              value={slotIso}
              disabled={!day}
              onChange={(e) => setSlotIso(e.target.value)}
              className={field}
            >
              <option value="">{day ? 'Choose a time' : 'Choose a day first'}</option>
              {day?.slots.map((s) => <option key={s.iso} value={s.iso}>{s.time}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="b-name" className="block text-sm font-semibold text-gray-800">Your name</label>
          <input id="b-name" name="name" required autoComplete="name" className={field} />
        </div>
        <div>
          <label htmlFor="b-phone" className="block text-sm font-semibold text-gray-800">Phone</label>
          <input id="b-phone" name="phone" type="tel" required autoComplete="tel" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="b-email" className="block text-sm font-semibold text-gray-800">Email</label>
        <input id="b-email" name="email" type="email" required autoComplete="email" className={field} />
      </div>

      <div>
        <label htmlFor="b-notes" className="block text-sm font-semibold text-gray-800">
          Anything we should know before the call? <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <textarea id="b-notes" name="notes" rows={3} maxLength={800} className={field} />
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
