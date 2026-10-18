'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Inbox, CalendarCheck, UserCheck, Contact2, Mail, FileText, ListTodo, MessageSquare, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ago } from '@/components/crm/ui';

/**
 * The bell: everything that arrived for this team member, newest first, with
 * an unread count. Rows are written by database triggers (see the
 * notifications migration) and read here through row-level security, so a
 * member only ever sees their own. Streams new rows when realtime is on and
 * polls every minute regardless.
 */
type Notification = { id: number; kind: string; title: string; body: string | null; href: string; created_at: string; read_at: string | null };

const ICON: Record<string, typeof Bell> = {
  inquiry: Inbox, booking: CalendarCheck, application: UserCheck, contact: Contact2, newsletter: Mail,
  review: FileText, assignment: ListTodo, comment: MessageSquare,
};

export default function NotificationBell({ side = 'sidebar' }: { side?: 'sidebar' | 'topbar' }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sb = useRef(createClient());
  const marking = useRef(new Set<number>());

  const load = useCallback(async () => {
    const [{ data }, { count }] = await Promise.all([
      sb.current.from('notifications').select('id, kind, title, body, href, created_at, read_at').order('created_at', { ascending: false }).limit(30),
      sb.current.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
    ]);
    if (data) setItems(data as Notification[]);
    if (typeof count === 'number') setUnread(count);
  }, []);

  useEffect(() => {
    load();
    const every = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);

    // Each bell instance gets its own channel topic: the browser client is a
    // singleton and a shared topic would let one instance tear down the other's.
    let channel: ReturnType<typeof sb.current.channel> | null = null;
    let cancelled = false;
    const client = sb.current;
    client.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      channel = client
        .channel(`notifications:${uid}:${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: 'INSERT', schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'proj_mmd', table: 'notifications', filter: `user_id=eq.${uid}` }, () => load())
        .subscribe();
    });
    return () => {
      cancelled = true;
      clearInterval(every);
      window.removeEventListener('focus', onFocus);
      if (channel) client.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  async function markRead(id: number) {
    if (!items.some((x) => x.id === id && !x.read_at) || marking.current.has(id)) return;
    marking.current.add(id);
    try {
      const now = new Date().toISOString();
      const { data, error } = await sb.current.from('notifications').update({ read_at: now }).eq('id', id).is('read_at', null).select('id');
      if (!error && data?.length) {
        setItems((xs) => xs.map((x) => x.id === id ? { ...x, read_at: now } : x));
        setUnread((n) => Math.max(0, n - data.length));
      }
      await load();
    } finally {
      marking.current.delete(id);
    }
  }
  async function markAll() {
    const now = new Date().toISOString();
    await sb.current.from('notifications').update({ read_at: now }).is('read_at', null);
    await load();
  }

  const panelPos = side === 'sidebar' ? 'left-0 top-full mt-2 lg:left-full lg:top-0 lg:ml-3 lg:mt-0' : 'right-0 top-full mt-2';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        className={`relative grid h-9 w-9 place-items-center rounded-lg ${side === 'sidebar' ? 'text-white/70 hover:bg-white/10 hover:text-white' : 'text-navy hover:bg-slate-100'}`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications" className={`absolute z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl ${panelPos}`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-bold text-navy-deep">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 text-xs font-semibold text-steel hover:underline">
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">Nothing yet. New inquiries, bookings, applications and assignments will show here.</p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => {
                const Icon = ICON[n.kind] ?? Bell;
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => { markRead(n.id); setOpen(false); }}
                      className={`flex gap-3 px-4 py-3 hover:bg-slate-50 ${n.read_at ? '' : 'bg-sky-50/60'}`}
                    >
                      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${n.read_at ? 'bg-slate-100 text-slate-500' : 'bg-navy text-white'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm ${n.read_at ? 'text-slate-700' : 'font-semibold text-navy-deep'}`}>{n.title}</span>
                        {n.body && <span className="block truncate text-xs text-slate-500">{n.body}</span>}
                        <span className="block text-[11px] text-slate-400">{ago(n.created_at)}</span>
                      </span>
                      {!n.read_at && <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sky-500" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
