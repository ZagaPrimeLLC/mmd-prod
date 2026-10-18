'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureFirstTouch } from '@/lib/attribution';
import { getSessionId } from '@/lib/analytics/session';
import { EVENT_VERSION, type EventName } from '@/lib/analytics/events';
import { isPublicPath } from '@/lib/analytics/paths';
import { analyticsRetryDelay } from '@/lib/analytics/retry';

/**
 * First-party measurement for the public site (never the CRM). Cookieless: a
 * per-tab session id is the only identifier. Events are queued and sent in
 * small acknowledged batches while the page is active, and handed to
 * sendBeacon when the tab is hidden or closed. Nothing here can block the
 * page, a form or a link; the rules for each event are in lib/analytics/events.ts.
 */

type Props = Record<string, string | number>;
type Ev = { id: string; sid: string; ts: string; event: EventName; path: string; props?: Props };

const ENDPOINT = '/api/t';
const MAX_BATCH = 50;
const MAX_BYTES = 30_000;
const FLUSH_AFTER_MS = 5_000;
const FLUSH_AT = 20;
const IMPRESSION_MS = 1_000;
const ACTIVE_WINDOW_MS = 15_000;

const queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let meta: Record<string, string | boolean> | null = null;
let seq = 0;
const failedOnce = new Set<string>();
let generation = 0;
let active = false;
let retryAt = 0;

function optedOut() {
  try { return localStorage.getItem('mmd_optout') === '1'; } catch { return false; }
}

function buildMeta() {
  const m: Record<string, string | boolean> = { v: String(EVENT_VERSION) };
  try {
    if (document.referrer) {
      const u = new URL(document.referrer);
      if (u.origin !== location.origin) m.ref_host = u.hostname.slice(0, 120);
    }
  } catch { /* unparseable referrer */ }
  const params = new URLSearchParams(location.search);
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
    const v = params.get(k);
    if (v) m[k] = v.slice(0, 120);
  }
  if (navigator.webdriver) m.webdriver = true;
  return m;
}

function send(batch: Ev[], final: boolean) {
  const sentGeneration = generation;
  const body = JSON.stringify({ meta, events: batch });
  if (final && typeof navigator.sendBeacon === 'function' && byteLength(body) < 60_000) {
    // Queued by the browser, not acknowledged by the server; good enough on the way out.
    if (navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))) {
      batch.forEach(e => failedOnce.delete(e.id));
      return;
    }
  }
  const finish = (delay: number | null) => {
    if (!active || sentGeneration !== generation) return;
    const again = delay !== null && !final ? batch.filter(e => !failedOnce.has(e.id)) : [];
    batch.forEach(e => failedOnce.delete(e.id));
    again.forEach(e => failedOnce.add(e.id));
    if (again.length) {
      retryAt = Math.max(retryAt, Date.now() + delay!);
      queue.push(...again);
      trimQueue();
      schedule();
    }
  };
  fetch(ENDPOINT, { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true, credentials: 'same-origin' })
    .then(r => finish(r.ok ? null : analyticsRetryDelay(r.status, r.headers.get('Retry-After'), r.headers.get('X-Analytics-Error') === 'configuration')))
    .catch(() => finish(FLUSH_AFTER_MS));
}

function schedule() {
  if (active && !timer) timer = setTimeout(() => flush(false), Math.max(FLUSH_AFTER_MS, retryAt - Date.now()));
}

function flush(final: boolean) {
  if (timer) { clearTimeout(timer); timer = null; }
  // While waiting to retry, hold routine sends; leaving the page always sends.
  if (!final && Date.now() < retryAt) { schedule(); return; }
  while (queue.length) {
    const batch = queue.splice(0, MAX_BATCH);
    while (batch.length > 1 && byteLength(JSON.stringify(batch)) > MAX_BYTES) queue.unshift(batch.pop()!);
    send(batch, final);
  }
}

const MAX_QUEUE = 500;
const encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;
/** Size as the server measures it: bytes, not characters. */
function byteLength(s: string) { return encoder ? encoder.encode(s).length : s.length * 3; }

/**
 * A long outage must not grow memory without limit. Applied wherever events
 * enter the queue (new events and retries): keep the newest, and forget the
 * retry bookkeeping of the ones dropped.
 */
function trimQueue() {
  if (queue.length <= MAX_QUEUE) return;
  for (const e of queue.splice(0, queue.length - MAX_QUEUE)) failedOnce.delete(e.id);
}

/** For tests: how much the tracker is holding. */
export function trackerStats() {
  return { queued: queue.length, retrying: failedOnce.size };
}

function emit(event: EventName, props?: Props, path = location.pathname) {
  if (!view || !isPublicPath(path) || optedOut()) return;
  if (!meta) meta = buildMeta();
  const sid = getSessionId();
  queue.push({
    id: `${sid}.${Date.now().toString(36)}.${(seq++).toString(36)}`,
    sid,
    ts: new Date().toISOString(),
    event,
    path,
    ...(props ? { props } : {}),
  });
  trimQueue();
  if (queue.length >= FLUSH_AT) flush(false);
  else schedule();
}

/** Everything that is "once per view": reset when the route changes. */
type View = {
  path: string;
  seen: Set<string>;          // slots, ctas, scroll marks, form starts, video marks
  engagedMs: number;
  sentMs: number;
  lastInput: number;
};
let view: View | null = null;
let lastViewAt = 0;

function startView(path: string) {
  const now = Date.now();
  // React may mount twice in development; the same path within half a second is one view.
  if (view && view.path === path && now - lastViewAt < 500) return;
  endView();
  if (!isPublicPath(path)) return;
  view = { path, seen: new Set(), engagedMs: 0, sentMs: 0, lastInput: now };
  lastViewAt = now;
  emit('page_view', { title: document.title.slice(0, 120) }, path);
  requestAnimationFrame(() => { if (view?.path === path) { rearm(); watchVideos(); } });
}

function sendEngaged() {
  if (!view) return;
  // Capped per view at 30 minutes of engaged time, in total.
  const capped = Math.min(view.engagedMs, 1800 * 1000);
  const delta = Math.round((capped - view.sentMs) / 1000);
  if (delta >= 1) {
    view.sentMs = capped;
    emit('engaged_time', { seconds: delta }, view.path);
  }
}

function endView() {
  if (!view) return;
  sendEngaged();
  view = null;
}

// ── Impressions: ≥50% visible for one continuous second while the tab is visible.
const pending = new Map<Element, ReturnType<typeof setTimeout>>();
const observed = new Set<Element>();
let io: IntersectionObserver | null = null;

function keyFor(el: Element) {
  const cta = el.getAttribute('data-cta');
  if (cta) return `cta:${cta}:${el.getAttribute('data-placement') ?? 'default'}`;
  return `slot:${el.getAttribute('data-track-slot') ?? ''}`;
}

function onIntersect(entries: IntersectionObserverEntry[]) {
  for (const en of entries) {
    const el = en.target;
    const t = pending.get(el);
    if (en.isIntersecting && en.intersectionRatio >= 0.5 && document.visibilityState === 'visible') {
      if (t) continue;
      pending.set(el, setTimeout(() => {
        pending.delete(el);
        if (!view || document.visibilityState !== 'visible') return;
        const key = keyFor(el);
        if (view.seen.has(key)) return;
        view.seen.add(key);
        const cta = el.getAttribute('data-cta');
        if (cta) emit('cta_impression', { cta_id: cta, placement_id: el.getAttribute('data-placement') ?? 'default' });
        else emit('section_impression', { slot: el.getAttribute('data-track-slot') ?? '' });
      }, IMPRESSION_MS));
    } else if (t) {
      clearTimeout(t);
      pending.delete(el);
    }
  }
}

function observeAll() {
  if (!io) io = new IntersectionObserver(onIntersect, { threshold: [0, 0.5, 1] });
  document.querySelectorAll('[data-track-slot], [data-cta]').forEach((el) => {
    if (observed.has(el)) return;
    observed.add(el);
    io!.observe(el);
  });
}

/**
 * A new view, or the tab coming back: forget armed timers and ask the observer
 * for a fresh reading of every tracked element, so persistent elements (the
 * header button) and elements already on screen count once for this view.
 */
function rearm() {
  for (const t of pending.values()) clearTimeout(t);
  pending.clear();
  if (!io) io = new IntersectionObserver(onIntersect, { threshold: [0, 0.5, 1] });
  for (const el of observed) {
    if (!el.isConnected) { observed.delete(el); continue; }
    io.unobserve(el);
    io.observe(el);
  }
  observeAll();
}

// ── Video: milestones of the muted loops on the page.
let videosWatched = new WeakSet<HTMLVideoElement>();
let listenerScope: AbortController | null = null;
function watchVideos() {
  document.querySelectorAll('video').forEach((v) => {
    if (videosWatched.has(v)) return;
    videosWatched.add(v);
    const name = v.dataset.video ?? (v.currentSrc || v.getAttribute('src') || 'video').split('/').pop()!.replace(/\.[a-z0-9]+$/i, '');
    v.addEventListener('timeupdate', () => {
      if (!view || !v.duration) return;
      const pct = Math.floor((v.currentTime / v.duration) * 4) * 25;
      if (pct < 25) return;
      const key = `video:${name}:${pct}`;
      if (view.seen.has(key)) return;
      view.seen.add(key);
      emit('video_progress', { video: name.slice(0, 60), pct });
    }, { signal: listenerScope?.signal });
  });
}

// ── Interaction listeners, attached once.
function wire() {
  active = true;
  generation++;
  const scope = new AbortController();
  listenerScope = scope;
  const listen = (target: EventTarget, type: string, fn: EventListener, options: AddEventListenerOptions = {}) =>
    target.addEventListener(type, fn, { ...options, signal: scope.signal });

  const touch = () => { if (view) view.lastInput = Date.now(); };
  for (const t of ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove']) {
    listen(document, t, touch, { passive: true, capture: true });
  }
  const heartbeat = setInterval(() => {
    if (view && document.visibilityState === 'visible' && Date.now() - view.lastInput < ACTIVE_WINDOW_MS) view.engagedMs += 1000;
  }, 1000);

  listen(document, 'click', (e) => {
    const el = (e.target as Element | null)?.closest('a, button') as HTMLElement | null;
    if (!el) return;
    const ctaEl = el.closest('[data-cta]') as HTMLElement | null;
    if (ctaEl) {
      const href = el.getAttribute('href') ?? '';
      let where = '';
      try { const u = new URL(href, location.href); where = u.origin === location.origin ? (isPublicPath(u.pathname) ? u.pathname : '') : u.hostname; } catch { /* not a url */ }
      emit('cta_click', { cta_id: ctaEl.getAttribute('data-cta')!, placement_id: ctaEl.getAttribute('data-placement') ?? 'default', href: where.slice(0, 120) });
    }
    const href = el.getAttribute('href') ?? '';
    if (!href) return;
    if (href.startsWith('tel:')) emit('contact_action', { kind: 'call' });
    else if (href.startsWith('mailto:')) emit('contact_action', { kind: 'email' });
    else if (/wa\.me|whatsapp/i.test(href)) emit('contact_action', { kind: 'whatsapp' });
    else {
      try {
        const u = new URL(href, location.href);
        if (/\.(pdf|docx?|xlsx?|pptx?)$/i.test(u.pathname)) emit('download_click', { file: u.pathname.split('/').pop()!.slice(0, 80) });
        else if (u.origin !== location.origin && /^https?:$/.test(u.protocol)) emit('outbound_click', { host: u.hostname.slice(0, 120) });
      } catch { /* not a url */ }
    }
  }, { capture: true });

  listen(document, 'focusin', (e) => {
    const form = (e.target as Element | null)?.closest('form');
    if (!form || !view) return;
    const name = form.dataset.form || form.id || 'form';
    const key = `form:${name}`;
    if (view.seen.has(key)) return;
    view.seen.add(key);
    emit('form_start', { form: name.slice(0, 60) });
  });

  // Forms report a failed submit with window.dispatchEvent(new CustomEvent('mmd:form_error', { detail: { form, category } })).
  listen(window, 'mmd:form_error', (e) => {
    const d = (e as CustomEvent<{ form?: string; category?: string }>).detail ?? {};
    emit('form_error', { form: String(d.form ?? 'form').slice(0, 60), category: String(d.category ?? 'error').slice(0, 40) });
  });

  let scrollTick = false;
  listen(document, 'scroll', () => {
    if (scrollTick || !view) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      if (!view) return;
      const h = document.documentElement;
      const pct = Math.round(((h.scrollTop + h.clientHeight) / Math.max(h.scrollHeight, 1)) * 100);
      for (const mark of [25, 50, 75, 100]) {
        const key = `scroll:${mark}`;
        if (pct >= mark && !view.seen.has(key)) { view.seen.add(key); emit('scroll_depth', { depth: mark }); }
      }
    });
  }, { passive: true });

  const leave = () => { sendEngaged(); flush(true); };
  listen(document, 'visibilitychange', () => {
    if (document.visibilityState === 'hidden') leave();
    else if (view) { view.lastInput = Date.now(); rearm(); }
  });
  listen(window, 'pagehide', leave);

  const mutations = new MutationObserver(() => {
    if (!view) return;
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(() => { if (view) { observeAll(); watchVideos(); } }, 200);
  });
  mutations.observe(document.body, { childList: true, subtree: true });
  return () => {
    endView();
    flush(true);
    active = false;
    generation++;
    if (timer) { clearTimeout(timer); timer = null; }
    queue.length = 0;
    failedOnce.clear();
    retryAt = 0;
    meta = null;
    scope.abort();
    listenerScope = null;
    clearInterval(heartbeat);
    clearTimeout(mutationTimer);
    mutations.disconnect();
    io?.disconnect();
    io = null;
    for (const t of pending.values()) clearTimeout(t);
    pending.clear();
    observed.clear();
    videosWatched = new WeakSet();
  };
}
let mutationTimer: ReturnType<typeof setTimeout> | undefined;

export default function SiteTracking() {
  const pathname = usePathname();

  useEffect(() => {
    captureFirstTouch();
    return wire();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    startView(pathname);
    return endView;
  }, [pathname]);

  return null;
}
