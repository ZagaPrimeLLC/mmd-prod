'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { site } from '@/lib/site';
import FormPrivacyNote from '@/components/site/FormPrivacyNote';

const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export default function CareersForm() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [resumeFailed, setResumeFailed] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const supabase = createClient();

    const resume = fd.get('resume') as File | null;
    let resumeNote = '';

    if (resume && resume.size > 0) {
      if (resume.size > MAX_RESUME_BYTES) {
        setBusy(false);
        setError('That file is larger than 10MB. Please attach a smaller file.');
        return;
      }
      const safe = resume.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      // A random segment in the name means a stored resume cannot be guessed at
      // from the outside, on top of the bucket already being private.
      const token = crypto.randomUUID().slice(0, 12);
      const path = `applications/${Date.now()}-${token}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from('mmd-resumes')
        .upload(path, resume, { upsert: false, contentType: resume.type || undefined });
      // An upload failure must not lose the application itself, but the applicant
      // has to be told plainly rather than shown a success screen that is not true.
      setResumeFailed(Boolean(upErr));
      resumeNote = upErr
        ? `\n\n[resume "${safe}" did NOT upload, the applicant was asked to email it to ${site.email}]`
        : `\n\n[resume: ${path}]`;
    }

    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim() || null,
      phone: String(fd.get('phone') ?? '').trim() || null,
      service_interested: 'dsp-application',
      message:
        `DSP application. Area: ${String(fd.get('area') ?? 'not given')}\n` +
        `Availability: ${String(fd.get('availability') ?? 'not given')}\n` +
        `CPR/First Aid certified: ${fd.get('cpr') ? 'yes' : 'not stated'}\n` +
        `Driver with own vehicle: ${fd.get('driver') ? 'yes' : 'not stated'}\n` +
        `Experience: ${String(fd.get('experience') ?? '').trim()}` + resumeNote,
      source_page: '/careers',
    };

    if (!payload.email && !payload.phone) {
      setBusy(false);
      setError('Please give us an email address or a phone number so we can reach you.');
      return;
    }

    const { error: insErr } = await supabase.from('inquiries').insert(payload);
    setBusy(false);
    if (insErr) setError(`We could not send that. Please call us on ${site.phone}.`);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <CheckCircle2 className="mb-3 h-7 w-7 text-green-700" />
        <h3 className="text-lg font-bold text-green-900">Application received.</h3>
        <p className="mt-2 text-sm leading-relaxed text-green-900">
          Our hiring team will call you to go through the role and check availability. You can also
          come to the office during walk-in hours: <strong>{site.walkIn}</strong>, at {site.address.street},{' '}
          {site.address.city}, {site.address.state}.
        </p>
        {resumeFailed && (
          <p role="alert" className="mt-4 rounded-lg bg-white p-3 text-sm leading-relaxed text-gray-800 ring-1 ring-amber-300">
            <strong>Your resume did not attach.</strong> Everything else came through. Please email
            the file to{' '}
            <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">
              {site.email}
            </a>{' '}
            so we have it with your application.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="block text-sm font-semibold text-gray-800">Full name</label>
          <input id="c-name" name="name" required autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
        <div>
          <label htmlFor="c-phone" className="block text-sm font-semibold text-gray-800">Phone</label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-email" className="block text-sm font-semibold text-gray-800">Email</label>
          <input id="c-email" name="email" type="email" autoComplete="email"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
        <div>
          <label htmlFor="c-area" className="block text-sm font-semibold text-gray-800">Town or county you can work in</label>
          <input id="c-area" name="area" placeholder="e.g. Washington, Warren County"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
        </div>
      </div>

      <div>
        <label htmlFor="c-availability" className="block text-sm font-semibold text-gray-800">Availability</label>
        <select id="c-availability" name="availability"
          className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy">
          <option value="">Select…</option>
          <option>Weekday days</option>
          <option>Weekday evenings</option>
          <option>Weekends</option>
          <option>Overnights</option>
          <option>Flexible</option>
        </select>
      </div>

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-semibold text-gray-800">Tick anything that applies</legend>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="cpr" className="h-5 w-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700">I am CPR and First Aid certified</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="driver" className="h-5 w-5 rounded border-gray-300" />
          <span className="text-sm text-gray-700">I drive and have my own vehicle</span>
        </label>
      </fieldset>

      <div>
        <label htmlFor="c-exp" className="block text-sm font-semibold text-gray-800">Relevant experience</label>
        <textarea id="c-exp" name="experience" rows={3} maxLength={1500}
          placeholder="Any experience supporting adults with disabilities, caregiving, or related work."
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-3 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy" />
      </div>

      <div>
        <span className="block text-sm font-semibold text-gray-800">Resume (optional)</span>
        <label htmlFor="c-resume" className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-4 hover:border-navy">
          <Upload className="h-5 w-5 text-steel" />
          <span className="text-sm text-gray-600">{fileName ?? 'Attach a PDF or Word file (max 10MB)'}</span>
        </label>
        <input id="c-resume" name="resume" type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} className="sr-only" />
      </div>

      <p className="rounded-lg bg-cream p-4 text-xs leading-relaxed text-gray-600">
        All Direct Support Professionals must clear federal and New Jersey State screening,
        fingerprinting, drug screening and Central Registry verification, and hold CPR and First Aid
        certification. We will walk you through each step.
      </p>

      <FormPrivacyNote />

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
        </p>
      )}

      <button type="submit" disabled={busy}
        className="rounded-lg bg-gold px-8 py-3.5 font-bold text-navy hover:bg-gold-dark disabled:opacity-60">
        {busy ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  );
}
