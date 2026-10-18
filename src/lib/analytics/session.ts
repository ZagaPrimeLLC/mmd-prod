import { SESSION_IDLE_MINUTES } from '@/lib/analytics/events';

/**
 * The visitor's measurement session: a random id kept in sessionStorage for
 * this tab, renewed after 30 minutes without activity. It is not a cookie,
 * identifies no person, and is the only link between website activity and a
 * saved inquiry. sessionStorage is tab-scoped (a new tab is a new session) and
 * can be unavailable; then the id lives only in memory for this page.
 */
const KEY = 'mmd_s';
let memory: { id: string; at: number } | null = null;

function fresh(): string {
  try {
    return crypto.randomUUID().replace(/-/g, '');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function read(): { id: string; at: number } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return memory;
    const v = JSON.parse(raw) as { id?: unknown; at?: unknown };
    if (typeof v.id === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v.id) && typeof v.at === 'number') return { id: v.id, at: v.at };
    return memory;
  } catch {
    return memory;
  }
}

function write(s: { id: string; at: number }) {
  memory = s;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage blocked: memory copy is enough for this page
  }
}

/** The current session id, renewing it when idle for too long. Safe to call from forms. */
export function getSessionId(): string {
  const now = Date.now();
  const cur = read();
  if (cur && now - cur.at < SESSION_IDLE_MINUTES * 60_000) {
    write({ id: cur.id, at: now });
    return cur.id;
  }
  const s = { id: fresh(), at: now };
  write(s);
  return s.id;
}
