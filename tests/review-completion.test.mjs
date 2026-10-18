import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './helpers/load-ts.mjs';

const nodes = e => !e || typeof e !== 'object' ? [] : Array.isArray(e) ? e.flatMap(nodes) : [e, ...nodes(e.props?.children)];
const text = e => typeof e === 'string' ? e : Array.isArray(e) ? e.map(text).join('') : e && typeof e === 'object' ? text(e.props?.children) : '';

function hooks() {
  const state = [], pending = [];
  let cursor = 0;
  const react = {
    useState(init) { const i = cursor++; if (!(i in state)) state[i] = typeof init === 'function' ? init() : init; return [state[i], v => { state[i] = typeof v === 'function' ? v(state[i]) : v; }]; },
    useRef(value) { return react.useState(() => ({ current: value }))[0]; },
    useEffect() {}, useMemo: f => f(), useCallback: f => f,
    useTransition: () => [false, f => pending.push(f())],
  };
  return { react, state, pending, render: (Component, props) => { cursor = 0; return nodes(Component(props)); } };
}

test('private and token-bearing paths cannot enter analytics', () => {
  const { isPublicPath } = loadTs('src/lib/analytics/paths.ts');
  for (const path of ['/', '/contact', '/contact/testimonials', '/careers/direct-support-professional', '/areas/warren', '/nondiscrimination', '/notice-of-privacy-practices']) assert.equal(isPublicPath(path), true, path);
  for (const path of ['/welcome/secret', '/dashboard', '/login', '/api/t', '/contact?token=secret', '//welcome/secret', '/careers/../welcome/secret']) assert.equal(isPublicPath(path), false, path);
});

test('ingest failures are retryable, local visits excluded, and private routes discarded', async () => {
  let args, calls = 0;
  const { POST } = loadTs('src/app/api/t/route.ts', {
    globals: { console: { error() {} }, process: { env: { ANALYTICS_INGEST_KEY: 'test-only-key' } } },
    mocks: { 'next/server': { NextResponse: Response }, '@supabase/supabase-js': { createClient: () => ({ rpc: async (_name, value) => { args = value; calls++; return { error: { message: 'Database unavailable' } }; } }) } },
  });
  const request = path => ({ headers: new Headers({ 'user-agent': 'Mozilla/5.0' }), cookies: { get() {} }, text: async () => JSON.stringify({ events: [{ path, event: 'page_view' }] }) });
  assert.equal((await POST(request('/'))).status, 503);
  assert.equal(args.p_meta.is_preview, true);
  assert.equal((await POST(request('/welcome/private-token'))).status, 204);
  assert.equal(calls, 1);
});

test('tracker removes listeners, timers and observers and ignores late fetch failures after leaving', async () => {
  const effects = [], packets = [], listeners = new Set(), intervals = new Map(), timers = new Map();
  let sequence = 0, disconnected = 0;
  let failFetch;
  const target = { addEventListener(type, fn, opts) {
    const entry = { type, fn }; listeners.add(entry);
    opts?.signal?.addEventListener('abort', () => listeners.delete(entry));
  } };
  const location = { pathname: '/', origin: 'https://example.test', href: 'https://example.test/', search: '' };
  const document = { ...target, title: 'Fixture', referrer: '', visibilityState: 'visible', body: {}, querySelectorAll: () => [] };
  const { default: Tracker } = loadTs('src/components/site/SiteTracking.tsx', {
    globals: { document, location, window: target, localStorage: { getItem: () => null }, navigator: {}, AbortController, Blob,
      requestAnimationFrame: f => f(), setInterval: f => { const id = ++sequence; intervals.set(id, f); return id; }, clearInterval: id => intervals.delete(id),
      setTimeout: f => { const id = ++sequence; timers.set(id, f); return id; }, clearTimeout: id => timers.delete(id),
      IntersectionObserver: class { observe() {} unobserve() {} disconnect() { disconnected++; } },
      MutationObserver: class { observe() {} disconnect() { disconnected++; } },
      fetch: (_url, options) => { packets.push(JSON.parse(options.body)); return new Promise((_resolve,reject)=>{ failFetch=reject; }); },
    },
    mocks: { react: { useEffect: f => effects.push(f) }, 'next/navigation': { usePathname: () => location.pathname }, '@/lib/attribution': { captureFirstTouch() {} }, '@/lib/analytics/session': { getSessionId: () => 'test-session' } },
  });
  Tracker();
  const cleanup = effects.map(f => f());
  const focus = [...listeners].find(x => x.type === 'focusin').fn;
  [...timers.values()][0]();
  cleanup.forEach(f => f?.());
  failFetch(new Error('offline after unmount'));
  await Promise.resolve(); await Promise.resolve();
  location.pathname = '/welcome/private-token';
  focus({ target: { closest: () => ({ dataset: { form: 'private-form' } }) } });
  assert.equal(listeners.size, 0);
  assert.equal(intervals.size, 0);
  assert.equal(timers.size, 0);
  assert.equal(disconnected, 2);
  assert.equal(packets.flatMap(p => p.events).some(e => e.path.includes('private-token')), false);
});

test('notes stay with their lead and a delayed save preserves newer text', async () => {
  const h = hooks(), saved = [];
  let finish;
  const { default: Inbox } = loadTs('src/components/crm/InboxClient.tsx', { mocks: {
    react: h.react, '@/components/crm/ui': { ago: () => '', dateLabel: () => '' }, 'next/navigation': { useSearchParams: () => null },
    '@/app/(dashboard)/dashboard/inbox/actions': { addNote: (type, id, body) => { saved.push({ type, id, body }); return new Promise(resolve => { finish = () => resolve({ ok: true, row: { id: 'note', body } }); }); } },
  } });
  const props = { conversations: ['A', 'B'].map(id => ({ id, key: `inquiry:${id}`, type: 'inquiry', name: `Person ${id}`, created_at: '2026-10-16', status: 'new' })), members: [], boards: [], canWrite: true, userId: 'test' };
  const render = () => h.render(Inbox, props);
  render().find(e => e.type === 'textarea').props.onChange({ target: { value: 'Note for A' } });
  render().find(e => e.type === 'button' && text(e).includes('Person B')).props.onClick();
  assert.equal(render().find(e => e.type === 'textarea').props.value, '');
  render().find(e => e.type === 'button' && text(e).includes('Person A')).props.onClick();
  render().find(e => e.type === 'button' && text(e).includes('Add note')).props.onClick();
  const enter = () => render().find(e => e.type === 'textarea').props.onKeyDown({ ctrlKey: true, key: 'Enter', preventDefault() {} });
  enter(); enter();
  render().find(e => e.type === 'textarea').props.onChange({ target: { value: 'Newer text for A' } });
  finish(); await Promise.all(h.pending);
  assert.deepEqual(saved, [{ type: 'inquiry', id: 'A', body: 'Note for A' }]);
  assert.equal(render().find(e => e.type === 'textarea').props.value, 'Newer text for A');
});

test('clicking an already-read notification preserves the unread count', () => {
  const h = hooks(); let updates = 0;
  const { default: Bell } = loadTs('src/components/crm/NotificationBell.tsx', { mocks: {
    react: h.react, 'next/link': { default: 'a' }, '@/components/crm/ui': { ago: () => '' },
    '@/lib/supabase/client': { createClient: () => ({ from: () => { updates++; throw new Error('No write expected'); } }) },
  } });
  h.render(Bell, {});
  h.state[0] = [{ id: 1, kind: 'inquiry', title: 'Already read', href: '/dashboard/inbox', read_at: '2026-10-16' }];
  h.state[1] = 3; h.state[2] = true;
  h.render(Bell, {}).find(e => e.props?.href === '/dashboard/inbox').props.onClick();
  assert.equal(h.state[1], 3); assert.equal(updates, 0);
});

test('a CMS outage cannot reopen closed appointment dates', async () => {
  const { getSchedule } = loadTs('src/lib/cms/read.ts', { globals: { console: { error() {} } }, mocks: {
    'next/cache': { unstable_cache: f => f, unstable_noStore() {} }, 'next/headers': { draftMode: async () => ({ isEnabled: false }) },
    '@supabase/supabase-js': { createClient: () => ({ rpc: async () => ({ data: null, error: { message: 'offline' } }) }) }, '@/lib/supabase/server': {},
  } });
  const schedule = await getSchedule();
  const { availableDays, officeHoursLabel } = loadTs('src/lib/booking.ts');
  assert.equal(schedule.unavailable, true);
  assert.equal(availableDays(new Date('2026-10-18T12:00:00Z'), schedule).length, 0);
  assert.match(officeHoursLabel(schedule), /to confirm current hours/);
});

test('the CMS editor finds live content beyond thirty newer drafts', async () => {
  const published = { id: 'live', content: { text: 'Approved live badge' }, status: 'published', published_at: '2026-10-01' };
  const sb = { from(table) { let live = false; return {
    select() { return this; }, eq(k, v) { if (k === 'status' && v === 'published') live = true; return this; }, order() { return this; }, limit() { return this; },
    maybeSingle() { return Promise.resolve({ data: published, error: null }); },
    then(resolve) { resolve({ data: table === 'profiles' ? [] : live ? [published] : Array.from({ length: 30 }, (_, i) => ({ id: String(i), content: { text: 'New draft' }, status: 'draft', created_at: '2026-10-16' })), error: null }); },
  }; } };
  const { default: Page } = loadTs('src/app/(dashboard)/dashboard/content/[key]/page.tsx', { mocks: {
    '@/lib/crm/session': { getSession: async () => ({ supabase: sb, user: { id: 'admin' }, role: 'admin' }) },
    '../actions': { saveDraft() {}, setStatus() {}, publish() {} },
  } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ key: 'home.hero.badge' }), searchParams: Promise.resolve({}) }));
  assert.match(html, /Approved live badge/);
  assert.doesNotMatch(html, /nothing published yet/);
});

test('pagination reads past API caps and rejects partial results on failure', async () => {
  const { readAll } = loadTs('src/lib/supabase/read-all.ts');
  const data = Array.from({ length: 1201 }, (_, i) => i);
  const all = await readAll(async from => ({ data: data.slice(from, from + 37), error: null }));
  assert.deepEqual([...all.data], data);
  const failed = await readAll(async from => from ? { data: null, error: { message: 'offline' } } : { data: [1], error: null });
  assert.equal(failed.data.length, 0); assert.equal(failed.error.message, 'offline');
});

test('observed federal holidays and existing extra closure days exclude appointments', () => {
  const { isHoliday, availableDays } = loadTs('src/lib/booking.ts');
  for (const day of ['2026-07-03', '2027-07-05', '2027-11-11', '2026-10-12', '2027-12-31', '2026-12-24']) {
    const [y, m, d] = day.split('-').map(Number);
    assert.equal(isHoliday({ y, m, d }), true, day);
    const schedule = { days: [0, 1, 2, 3, 4, 5, 6], start: 660, end: 960, closed: [] };
    assert.equal(availableDays(new Date(Date.UTC(y, m - 1, d - 2, 12)), schedule).some(x => x.key === day), false, day);
  }
  assert.equal(isHoliday({ y: 2026, m: 7, d: 2 }), false);
});

test('chat answers use the published schedule text', () => {
  const { createChat } = loadTs('src/lib/chat-script.ts');
  const chat = createChat('Mondays, 9am to 2pm');
  assert.match(chat.booking.say.join(' '), /Mondays, 9am to 2pm/);
  assert.match(chat.job.say.join(' '), /Mondays, 9am to 2pm/);
  assert.doesNotMatch(chat.booking.say.join(' '), /Thursdays/);
  const unavailable = createChat('temporarily unavailable; please call to confirm', true);
  assert.match(unavailable.booking.say.join(' '), /cannot confirm consultation hours/);
  assert.equal(unavailable.booking.options[0].next, 'lead');
  assert.doesNotMatch(unavailable.job.say.join(' '), /come to the office on temporarily/);
});

test('reopening the same notification after choosing another conversation selects it again (A, B, A)', () => {
  const h=hooks();
  let url='?c=inquiry:A';
  const { default: Inbox }=loadTs('src/components/crm/InboxClient.tsx',{
    globals:{window:{history:{replaceState:(_s,_t,u)=>{url=u;}}}},
    mocks:{react:h.react,'@/components/crm/ui':{ago:()=>'',dateLabel:()=>''},'@/app/(dashboard)/dashboard/inbox/actions':{},
      'next/navigation':{useSearchParams:()=>new URLSearchParams(url)}},
  });
  const props={conversations:[{id:'A',key:'inquiry:A',type:'inquiry',name:'Person A',status:'new'},{id:'B',key:'inquiry:B',type:'inquiry',name:'Person B',status:'new'}],members:[],boards:[],canWrite:true,userId:'test',initialKey:'inquiry:A'};
  const heading=()=>text(h.render(Inbox,props).find(e=>e.type==='h2'));
  assert.equal(heading(),'Person A');                                  // opened from notification A
  h.render(Inbox,props).find(e=>e.type==='button'&&text(e).includes('Person B')).props.onClick();
  assert.equal(url,'?c=inquiry%3AB');                                  // the address bar follows the list
  assert.equal(heading(),'Person B');
  url='?c=inquiry:A';                                                  // notification A opened again; the initialKey prop is unchanged
  h.render(Inbox,props);
  assert.equal(heading(),'Person A');
});

test('same-route notification navigation selects its conversation and resets conflicting filters', () => {
  const h=hooks();
  const { default: Inbox }=loadTs('src/components/crm/InboxClient.tsx',{mocks:{react:h.react,'@/components/crm/ui':{ago:()=>'',dateLabel:()=>''},'@/app/(dashboard)/dashboard/inbox/actions':{},'next/navigation':{useSearchParams:()=>null}}});
  const props={conversations:[{id:'A',key:'inquiry:A',type:'inquiry',name:'Active person',status:'new'},{id:'B',key:'booking:B',type:'booking',name:'Archived person',status:'requested',archived:true}],members:[],boards:[],canWrite:true,userId:'test',initialKey:'inquiry:A'};
  h.render(Inbox,props).find(e=>e.type==='input').props.onChange({target:{value:'No match'}});
  props.initialKey='booking:B';
  h.render(Inbox,props);
  const tree=h.render(Inbox,props);
  assert.equal(text(tree.find(e=>e.type==='h2')),'Archived person');
  assert.equal(tree.find(e=>e.type==='input').props.value,'');
  assert.equal(tree.find(e=>e.props?.['aria-label']==='Filter conversations').props.value,'archived');
});

test('failed note saves retain the draft and release the immediate submission guard', async () => {
  const h=hooks();let calls=0;
  const { default: Inbox }=loadTs('src/components/crm/InboxClient.tsx',{mocks:{react:h.react,'@/components/crm/ui':{ago:()=>'',dateLabel:()=>''},'next/navigation':{useSearchParams:()=>null},'@/app/(dashboard)/dashboard/inbox/actions':{addNote:async()=>{calls++;throw new Error('network');}}}});
  const props={conversations:[{id:'A',key:'inquiry:A',type:'inquiry',name:'Person',status:'new'}],members:[],boards:[],canWrite:true,userId:'test'};
  const render=()=>h.render(Inbox,props);
  render().find(e=>e.type==='textarea').props.onChange({target:{value:'Keep my note'}});
  render().find(e=>e.type==='button'&&text(e).includes('Add note')).props.onClick();
  await Promise.all(h.pending);
  assert.equal(render().find(e=>e.type==='textarea').props.value,'Keep my note');
  render().find(e=>e.type==='button'&&text(e).includes('Add note')).props.onClick();
  await Promise.all(h.pending);assert.equal(calls,2);
});

test('unknown linked-card state does not offer another card', () => {
  const h=hooks();
  const { default: Inbox }=loadTs('src/components/crm/InboxClient.tsx',{mocks:{react:h.react,'@/components/crm/ui':{ago:()=>'',dateLabel:()=>''},'@/app/(dashboard)/dashboard/inbox/actions':{},'next/navigation':{useSearchParams:()=>null}}});
  const props={conversations:[{id:'A',key:'inquiry:A',type:'inquiry',name:'Person',status:'new'}],members:[],boards:[{id:'board',name:'Board'}],canWrite:true,userId:'test'};
  assert.equal(h.render(Inbox,props).some(e=>e.type==='button'&&text(e).includes('Make a work card')),false);
});

test('CMS errors cannot silently render unpublished defaults, and a later successful read recovers', async () => {
  let fail=true;
  const { getSlot }=loadTs('src/lib/cms/read.ts',{mocks:{
    'next/cache':{unstable_cache:f=>f},'next/headers':{draftMode:async()=>({isEnabled:false})},'@/lib/supabase/server':{},
    '@supabase/supabase-js':{createClient:()=>({rpc:async()=>fail?{error:{message:'offline'}}:{data:{text:'Approved notice',href:''}}})},
  }});
  await assert.rejects(()=>getSlot('global.announcement'),/offline/);
  fail=false;assert.equal((await getSlot('global.announcement')).text,'Approved notice');
});

test('analytics retries only transient failures and honors Retry-After', () => {
  const { analyticsRetryDelay: retry }=loadTs('src/lib/analytics/retry.ts');
  for(const status of [400,401,403,404,413,422]) assert.equal(retry(status,null),null);
  assert.equal(retry(503,null),5000);
  assert.equal(retry(503,'5',true),null);
  assert.equal(retry(429,'60'),60000);
  assert.equal(retry(429,'Thu, 01 Jan 2026 00:01:00 GMT',false,Date.parse('2026-01-01T00:00:00Z')),60000);
});

test('bad ingest credentials are a configuration failure without a retry instruction', async () => {
  const { POST }=loadTs('src/app/api/t/route.ts',{globals:{console:{error(){}},process:{env:{ANALYTICS_INGEST_KEY:'fixture'}}},mocks:{
    'next/server':{NextResponse:Response},'@supabase/supabase-js':{createClient:()=>({rpc:async()=>({error:{code:'42501',message:'invalid ingest key'}})})},
  }});
  const res=await POST({headers:new Headers({'user-agent':'Mozilla/5.0'}),cookies:{get(){}},text:async()=>JSON.stringify({events:[{path:'/',event:'page_view'}]})});
  assert.equal(res.status,503);assert.equal(res.headers.get('X-Analytics-Error'),'configuration');assert.equal(res.headers.get('Retry-After'),null);
});

test('publishing immediately expires content tags as well as affected layouts', async () => {
  const tags=[],paths=[];
  const { publish }=loadTs('src/app/(dashboard)/dashboard/content/actions.ts',{mocks:{
    'next/cache':{updateTag:t=>tags.push(t),revalidatePath:(...p)=>paths.push(p)},
    'next/navigation':{redirect:path=>{throw new Error(path);}},
    '@/lib/crm/session':{getSession:async()=>({role:'admin',supabase:{
      from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{id:'revision',slot_key:'home.hero.badge',content:{text:'Approved headline'}}})}),
      rpc:async()=>({error:null}),
    }})},
  }});
  const fd=new FormData();fd.set('key','home.hero.badge');fd.set('revision','revision');
  await assert.rejects(()=>publish(fd),/ok=/);
  assert.deepEqual(tags,['cms','cms:home.hero.badge']);
  assert.ok(paths.some(([path,type])=>path==='/'&&type==='layout'));
});


test('marketing copy falls back to its built-in text when the database is unreachable', async () => {
  const { getSlotSafe } = loadTs('src/lib/cms/read.ts', { globals: { console: { error() {} } }, mocks: {
    'next/cache': { unstable_cache: f => f, unstable_noStore() {} }, 'next/headers': { draftMode: async () => ({ isEnabled: false }) },
    '@supabase/supabase-js': { createClient: () => ({ rpc: async () => ({ error: { message: 'offline' } }) }) }, '@/lib/supabase/server': {},
  } });
  const { SLOTS } = loadTs('src/lib/cms/slots.ts');
  const def = SLOTS.find(s => s.key === 'home.hero.title').default;
  assert.equal(JSON.stringify(await getSlotSafe('home.hero.title')), JSON.stringify(def));
});

test('the site-wide announcement hides itself instead of breaking every page on an outage', async () => {
  const { default: Announcement } = loadTs('src/components/site/Announcement.tsx', { globals: { console: { error() {} } }, mocks: {
    '@/lib/cms/read': { getSlot: async () => { throw new Error('offline'); } },
  } });
  assert.equal(await Announcement(), null);
});

test('an office-hours outage fails a production build and is never cached at runtime', async () => {
  const load = phase => { let noStore = 0; const mod = loadTs('src/lib/cms/read.ts', {
    globals: { console: { error() {} }, process: { env: { NEXT_PHASE: phase } } }, mocks: {
      'next/cache': { unstable_cache: f => f, unstable_noStore() { noStore++; } }, 'next/headers': { draftMode: async () => ({ isEnabled: false }) },
      '@supabase/supabase-js': { createClient: () => ({ rpc: async () => ({ error: { message: 'offline' } }) }) }, '@/lib/supabase/server': {},
    } }); return { mod, calls: () => noStore }; };
  const build = load('phase-production-build');
  await assert.rejects(() => build.mod.getSchedule(), /during the build/);
  const runtime = load('phase-production-server');
  assert.equal((await runtime.mod.getSchedule()).unavailable, true);
  assert.equal(runtime.calls(), 1);
});

test('the retry wait is capped whatever Retry-After the server sends', () => {
  const { analyticsRetryDelay: retry, MAX_RETRY_DELAY } = loadTs('src/lib/analytics/retry.ts');
  assert.equal(MAX_RETRY_DELAY, 300000);
  assert.equal(retry(429, '99999999'), 300000);
  assert.equal(retry(503, 'Fri, 31 Dec 2100 00:00:00 GMT'), 300000);
});

test('the tracker queue stays bounded on both enqueue paths and forgets retry ids it drops', async () => {
  const effects = [], listeners = new Set(), timers = new Map(), inflight = [];
  let sequence = 0;
  const target = { addEventListener(type, fn, opts) { const e = { type, fn }; listeners.add(e); opts?.signal?.addEventListener('abort', () => listeners.delete(e)); } };
  const location = { pathname: '/', origin: 'https://example.test', href: 'https://example.test/', search: '' };
  const document = { ...target, title: 'Fixture', referrer: '', visibilityState: 'visible', body: {}, querySelectorAll: () => [] };
  const mod = loadTs('src/components/site/SiteTracking.tsx', {
    globals: { document, location, window: target, localStorage: { getItem: () => null }, navigator: {}, AbortController, Blob, TextEncoder,
      requestAnimationFrame: f => f(), setInterval: () => 0, clearInterval() {},
      setTimeout: f => { const id = ++sequence; timers.set(id, f); return id; }, clearTimeout: id => timers.delete(id),
      IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} }, MutationObserver: class { observe() {} disconnect() {} },
      fetch: () => new Promise(resolve => inflight.push(() => resolve({ ok: false, status: 503, headers: { get: h => (h === 'Retry-After' ? '60' : null) } }))),
    },
    mocks: { react: { useEffect: f => effects.push(f) }, 'next/navigation': { usePathname: () => location.pathname }, '@/lib/attribution': { captureFirstTouch() {} }, '@/lib/analytics/session': { getSessionId: () => 'test-session' } },
  });
  const { default: Tracker, trackerStats } = mod;
  Tracker();
  effects.forEach(f => f());
  const focus = [...listeners].find(x => x.type === 'focusin').fn;
  const startForms = (from, n) => { for (let i = from; i < from + n; i++) focus({ target: { closest: () => ({ dataset: { form: `form-${i}` } }) } }); };
  const settle = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

  startForms(0, 19);                     // request 1: the page view and 19 form starts, held in flight
  startForms(19, 20);                    // request 2: 20 more, held in flight
  assert.equal(inflight.length, 2);
  inflight[1](); await settle();         // request 2 fails: 20 events back for one retry, sends now wait 60s
  assert.equal(JSON.stringify(trackerStats()), JSON.stringify({ queued: 20, retrying: 20 }));
  startForms(39, 480);                   // during the wait the queue fills to its cap
  assert.equal(trackerStats().queued, 500);
  inflight[0](); await settle();         // request 1 fails too: its 20 events must not push the queue past the cap
  const afterRetry = trackerStats();
  assert.equal(afterRetry.queued, 500, 'retries cannot push the queue past its cap');
  assert.equal(afterRetry.retrying, 20, 'the dropped (oldest) retried events left no bookkeeping; the new ones are tracked');
  startForms(519, 600);                  // a long outage: every retried event ages out of the queue
  assert.equal(JSON.stringify(trackerStats()), JSON.stringify({ queued: 500, retrying: 0 }), 'dropped events leave no retry bookkeeping behind');
});

test('leaving the page sends queued events even while waiting to retry', async () => {
  const effects = [], listeners = new Set(), timers = new Map(), beacons = [];
  let sequence = 0;
  const target = { addEventListener(type, fn, opts) { const e = { type, fn }; listeners.add(e); opts?.signal?.addEventListener('abort', () => listeners.delete(e)); } };
  const location = { pathname: '/', origin: 'https://example.test', href: 'https://example.test/', search: '' };
  const document = { ...target, title: 'Fixture', referrer: '', visibilityState: 'visible', body: {}, querySelectorAll: () => [] };
  const { default: Tracker } = loadTs('src/components/site/SiteTracking.tsx', {
    globals: { document, location, window: target, localStorage: { getItem: () => null }, AbortController, Blob, TextEncoder,
      navigator: { sendBeacon: (_u, blob) => { beacons.push(blob); return true; } },
      requestAnimationFrame: f => f(), setInterval: () => 0, clearInterval() {},
      setTimeout: f => { const id = ++sequence; timers.set(id, f); return id; }, clearTimeout: id => timers.delete(id),
      IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} }, MutationObserver: class { observe() {} disconnect() {} },
      fetch: async () => ({ ok: false, status: 503, headers: { get: h => (h === 'Retry-After' ? '60' : null) } }),
    },
    mocks: { react: { useEffect: f => effects.push(f) }, 'next/navigation': { usePathname: () => location.pathname }, '@/lib/attribution': { captureFirstTouch() {} }, '@/lib/analytics/session': { getSessionId: () => 'test-session' } },
  });
  Tracker();
  effects.forEach(f => f());
  [...timers.values()][0]();                       // routine send of the page view: answered 503, retry in 60s
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  document.visibilityState = 'hidden';
  [...listeners].find(x => x.type === 'visibilitychange').fn();
  assert.equal(beacons.length, 1, 'the queued page view is sent on hide despite the pending retry');
  const sent = JSON.parse(await beacons[0].text());
  assert.ok(sent.events.some(e => e.event === 'page_view'));
});

test('the CMS editor flags a live revision the website cannot show', async () => {
  const published = { id: 'live', content: { text: '' }, status: 'published', published_at: '2026-10-01' };
  const sb = { from(table) { return {
    select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; },
    maybeSingle() { return Promise.resolve({ data: published, error: null }); },
    then(resolve) { resolve({ data: table === 'profiles' ? [] : [published], error: null }); },
  }; } };
  const { default: Page } = loadTs('src/app/(dashboard)/dashboard/content/[key]/page.tsx', { mocks: {
    '@/lib/crm/session': { getSession: async () => ({ supabase: sb, user: { id: 'admin' }, role: 'admin' }) },
    '../actions': { saveDraft() {}, setStatus() {}, publish() {} },
  } });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ key: 'home.hero.badge' }), searchParams: Promise.resolve({}) }));
  assert.match(html, /live version of this content is invalid/);
  assert.match(html, /invalid, not shown on the website/);
});

test('mobile and desktop consultation buttons share a button id and keep separate placements and booking sources', () => {
  const src = readFileSync(new URL('../src/components/site/SiteHeader.tsx', import.meta.url), 'utf8');
  assert.match(src, /href="\/contact\?cta=header#book"\s+data-cta="book-consultation"\s+data-placement="header"/);
  assert.match(src, /href="\/contact\?cta=mobile-header#book" data-cta="book-consultation" data-placement="mobile-header"/);
  const { ctaFromSearch } = loadTs('src/lib/cta.ts');
  assert.equal(ctaFromSearch('?cta=mobile-header'), 'mobile-header');
});
