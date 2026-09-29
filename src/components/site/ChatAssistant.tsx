'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, CheckCircle2, CalendarCheck } from 'lucide-react';
import { CHAT } from '@/lib/chat-script';
import { createClient } from '@/lib/supabase/client';
import { site } from '@/lib/site';

type Line = { from: 'bot' | 'user'; text: string };

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [node, setNode] = useState('start');
  const [lines, setLines] = useState<Line[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const trail = useRef<string[]>([]);

  useEffect(() => {
    if (open && lines.length === 0) push('start');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines, capturing, sent]);

  function push(id: string) {
    const n = CHAT[id];
    if (!n) return;
    setNode(id);
    if (n.capture === 'lead') { setCapturing(true); return; }
    setLines((l) => [...l, ...n.say.map((t) => ({ from: 'bot' as const, text: t }))]);
  }

  function choose(label: string, next: string) {
    trail.current.push(label);
    setLines((l) => [...l, { from: 'user', text: label }]);
    setTimeout(() => push(next), 250);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') ?? '').trim();
    const phone = String(fd.get('phone') ?? '').trim();
    const email = String(fd.get('email') ?? '').trim();
    const note = String(fd.get('note') ?? '').trim();

    if (!phone && !email) {
      setBusy(false);
      setError('Please leave a phone number or an email so we can reply.');
      return;
    }

    const { error } = await createClient().from('inquiries').insert({
      name,
      phone: phone || null,
      email: email || null,
      service_interested: 'chat-assistant',
      message:
        `Assistant conversation\nPath: ${trail.current.join(' > ') || 'direct'}\n` +
        (note ? `Their note: ${note}` : 'No extra note left.'),
      source_page: '/chat',
    });

    setBusy(false);
    if (error) setError(`Could not send that. Please call ${site.phone}.`);
    else { setSent(true); setCapturing(false); }
  }

  const current = CHAT[node];

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[60] grid h-16 w-16 place-items-center">
        {!open && (
          <span
            aria-hidden="true"
            className="mmd-chat-halo pointer-events-none absolute inset-0 rounded-full bg-gold"
          />
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close the assistant' : 'Open the assistant'}
          className={`relative grid h-14 w-14 place-items-center rounded-full bg-gold text-navy transition hover:bg-gold-dark ${open ? 'shadow-xl' : 'mmd-chat-fab'}`}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="MMD assistant"
          className="fixed bottom-24 right-5 z-[60] flex max-h-[min(34rem,calc(100dvh-8rem))] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:w-[23rem]"
        >
          <div className="shrink-0 bg-navy px-5 py-4 text-white">
            <p className="font-bold">MMD Community Care</p>
            <p className="text-xs text-gray-200">We reply to messages within one business day</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {lines.map((l, i) => (
              <p
                key={i}
                className={
                  l.from === 'bot'
                    ? 'max-w-[85%] rounded-2xl rounded-tl-sm bg-cream px-3.5 py-2.5 text-sm leading-relaxed text-gray-800'
                    : 'ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-navy px-3.5 py-2.5 text-sm text-white'
                }
              >
                {l.text}
              </p>
            ))}

            {sent && (
              <div className="rounded-xl bg-green-50 p-4">
                <CheckCircle2 className="mb-2 h-6 w-6 text-green-700" />
                <p className="text-sm leading-relaxed text-green-900">
                  Thank you. Your details are with the office and someone will call you. For anything
                  urgent, call <a href={site.phoneHref} className="font-semibold underline">{site.phone}</a>.
                </p>
              </div>
            )}

            {capturing && (
              <form onSubmit={submit} className="space-y-2.5 rounded-xl bg-cream p-3.5">
                <input name="name" required placeholder="Your name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                <input name="phone" type="tel" placeholder="Phone"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                <input name="email" type="email" placeholder="Email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                <textarea name="note" rows={2} maxLength={600} placeholder="Anything else? (optional)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                <p className="text-[11px] leading-relaxed text-gray-500">
                  Please do not include medical details here. For anything clinical, call the office.
                </p>
                {error && <p className="text-xs text-red-700">{error}</p>}
                <button type="submit" disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send to the office'}
                </button>
              </form>
            )}

            <div ref={endRef} />
          </div>

          {!capturing && !sent && current?.link && (
            <div className="shrink-0 border-t border-gray-100 px-4 py-3">
              <a href={current.link.href}
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-3.5 py-2.5 text-sm font-bold text-navy">
                <CalendarCheck className="h-4 w-4" /> {current.link.label}
              </a>
            </div>
          )}

          {!capturing && !sent && current?.options && (
            <div className="shrink-0 space-y-2 border-t border-gray-100 px-4 py-3">
              {current.options.map((o) => (
                <button key={o.id} type="button" onClick={() => choose(o.label, o.next)}
                  className="w-full rounded-lg border border-navy px-3.5 py-2.5 text-left text-sm font-medium text-navy hover:bg-navy hover:text-white">
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {!capturing && !sent && !current?.options && !current?.link && (
            <div className="shrink-0 border-t border-gray-100 px-4 py-3">
              <a href={site.phoneHref} className="block rounded-lg bg-gold px-3.5 py-2.5 text-center text-sm font-bold text-navy">
                Call {site.phone}
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
