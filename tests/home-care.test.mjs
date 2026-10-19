import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { loadTs } from './helpers/load-ts.mjs';

const nodes = e => !e || typeof e !== 'object' ? [] : Array.isArray(e) ? e.flatMap(nodes) : [e, ...nodes(e.props?.children)];

test('sharing metadata points to a compact landscape asset with matching encoded dimensions', async () => {
  const { default: sharp } = await import('sharp');
  const { socialImage, pageMetadata } = loadTs('src/lib/seo-metadata.ts');
  const imageUrl = new URL(socialImage.url);
  const imagePath = path.join(process.cwd(), 'public', imageUrl.pathname);
  const encoded = await sharp(imagePath).metadata();
  assert.equal(imageUrl.protocol, 'https:');
  assert.equal(socialImage.secureUrl, socialImage.url);
  assert.equal(socialImage.type, `image/${encoded.format}`);
  assert.equal(socialImage.width, encoded.width);
  assert.equal(socialImage.height, encoded.height);
  assert.equal(encoded.width, 1200);
  assert.equal(encoded.height, 630);
  assert.ok((await stat(imagePath)).size < 200_000, 'Sharing asset exceeded the project download budget');
  const metadata = pageMetadata({ title: 'Home care', description: 'Everyday support', path: '/services/home-health-aide' });
  assert.equal(metadata.openGraph.images[0].url, metadata.twitter.images[0].url);
});

test('home-care referrals preselect the service and preserve historic DDD inquiry values', () => {
  const { serviceFromSearch, serviceFromValue } = loadTs('src/lib/services.ts');
  assert.equal(serviceFromSearch('?service=home-health-aide&cta=header').inquiryValue, 'home-health-aide');
  assert.equal(serviceFromSearch('?cta=service-home-health-aide').slug, 'home-health-aide');
  assert.equal(serviceFromSearch('?service=respite&cta=service-home-health-aide').inquiryValue, 'respite-care');
  assert.equal(serviceFromValue('individual-support').slug, 'individual-supports');
  assert.equal(serviceFromValue('person@example.com'), undefined);
  assert.equal(serviceFromSearch('?service=unknown&cta=service-person@example.com'), undefined);
});

test('booking selection overrides URL and stale first-touch service without accepting arbitrary values', () => {
  const { getBookingAttribution } = loadTs('src/lib/attribution.ts', { globals: {
    localStorage: { getItem: () => JSON.stringify({ service: 'respite', utm_source: 'google' }) },
  } });
  const loc = { search: '?service=home-health-aide&cta=service-home-health-aide', pathname: '/contact' };
  const a = getBookingAttribution(loc, 'home-health-aide');
  assert.equal(a.service, 'home-health-aide');
  assert.equal(a.cta, 'service-home-health-aide');
  assert.equal(a.utm_source, 'google');
  assert.equal(getBookingAttribution(loc, 'respite-care').service, 'respite');
  assert.equal(getBookingAttribution(loc, '').service, undefined);
  assert.equal(getBookingAttribution(loc, 'person@example.com').service, undefined);
});

test('service selector renders home care selected and keeps both program groups available', () => {
  const { default: Select } = loadTs('src/components/site/ServiceSelect.tsx', { mocks: {
    'next/navigation': { useSearchParams: () => new URLSearchParams('service=home-health-aide') },
  } });
  const html = renderToStaticMarkup(Select({ id: 'booking-service' }));
  assert.match(html, /value="home-health-aide" selected=""/);
  assert.match(html, /Developmental Disability Services \(DDD\)/);
  assert.match(html, /value="respite-care"/);
  assert.match(html, /for="booking-service"/);
});

test('contact submission sends the selected home-care service through the actual inquiry payload', async () => {
  let payload;
  const values = { name: 'Test visitor', email: 'test@example.invalid', phone: '', service: 'home-health-aide', message: 'Please call about availability.' };
  const { default: Form } = loadTs('src/components/site/ContactForm.tsx', {
    globals: { window: { location: { search: '?cta=service-home-health-aide' } }, FormData: class { get(k) { return values[k]; } } },
    mocks: {
      react: { useState: initial => [initial, () => {}] },
      '@/lib/supabase/client': { createClient: () => ({ from: name => { assert.equal(name, 'inquiries'); return { insert: async p => { payload = p; return { error: null }; } }; } }) },
      '@/lib/attribution': { getAttribution: () => null },
      '@/lib/analytics/session': { getSessionId: () => 'test-session' },
    },
  });
  await nodes(Form({})).find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: {} });
  assert.equal(payload.service_interested, 'home-health-aide');
  assert.equal(payload.cta, 'service-home-health-aide');
  assert.equal(payload.session_id, 'test-session');
});

test('booking form persists the chosen service in its column and keeps it out of campaign attribution', async () => {
  let payload, state = 0;
  const iso = '2026-10-27T15:00:00.000Z';
  const values = { name: 'Test visitor', email: 'test@example.invalid', phone: '5550100', service: 'home-health-aide', notes: 'Availability enquiry' };
  const { default: Form } = loadTs('src/components/site/BookingFlow.tsx', {
    globals: { localStorage: { getItem: () => null }, window: { location: { search: '?cta=service-home-health-aide', pathname: '/contact' } }, FormData: class { get(k) { return values[k]; } } },
    mocks: {
      react: { useState: initial => [[ 'day', iso ][state++] ?? initial, () => {}], useMemo: fn => fn(), useSyncExternalStore: () => true },
      '@/lib/supabase/client': { createClient: () => ({ from: name => { assert.equal(name, 'bookings'); return { insert: async p => { payload = p; return { error: null }; } }; } }) },
      '@/lib/analytics/session': { getSessionId: () => 'test-session' },
      '@/lib/booking': { availableDays: () => [{ key: 'day', label: 'Tuesday', slots: [iso] }], officeHoursLabel: () => 'Tuesday', timeLabel: () => '11am', SLOT_MINUTES: 45 },
    },
  });
  await nodes(Form({ schedule: {} })).find(n => n.type === 'form').props.onSubmit({ preventDefault() {}, currentTarget: {} });
  assert.equal(payload.service_interested, 'home-health-aide');
  assert.equal(payload.attribution.service, undefined);
  assert.equal(payload.cta, 'service-home-health-aide');
  assert.equal(payload.requested_slot, iso);
  assert.equal(payload.notes, 'Availability enquiry');
});

test('home-care CMS defaults survive the editor validator without clipped copy', () => {
  const { SLOTS, validate } = loadTs('src/lib/cms/slots.ts');
  for (const slot of SLOTS.filter(s => s.key.startsWith('homecare.'))) {
    const result = validate(slot.type, slot.default);
    assert.equal(result.ok, true, slot.key);
    assert.equal(JSON.stringify(result.content), JSON.stringify(slot.default), slot.key);
    assert.ok(slot.paths.some(p => p === '/services/home-health-aide' || p === '/services'));
  }
});

test('home-care structured data does not inherit DDD age or county eligibility', () => {
  const { homeCareServiceLd, organizationLd } = loadTs('src/lib/schema.ts');
  const data = homeCareServiceLd();
  assert.equal(data.areaServed, undefined, 'Do not promise statewide home-care coverage');
  assert.match(data.audience.audienceType, /seniors/);
  assert.doesNotMatch(JSON.stringify(data), /21\+|DDD budget|Individualized Service Plan/);
  assert.ok(organizationLd().hasOfferCatalog.itemListElement.some(o => o.itemOffered.url.endsWith('/services/home-health-aide')));
});

test('service labels cover historical aliases, career inquiries and other requests without exposing codes', () => {
  const { serviceLabel, bookingServiceValue } = loadTs('src/lib/services.ts');
  for (const [code, name] of [['home-health-aide','Home Health Aide Services'],['community-support','Community-Based Supports'],['individual-support','Individual Supports'],['respite-care','Respite'],['other','Something else'],['dsp-application','DSP application']]) {
    assert.equal(serviceLabel(code), name);
  }
  assert.equal(bookingServiceValue('community-support'), 'community-based-supports');
  assert.equal(bookingServiceValue('other'), 'other');
  assert.equal(bookingServiceValue(''), null);
  assert.equal(bookingServiceValue('dsp-application'), null);
  assert.equal(bookingServiceValue('unrecognized'), null);
});

test('home-care page renders breadcrumb structured data and all four uncropped photo assets', async () => {
  const { slotByKey } = loadTs('src/lib/cms/slots.ts');
  const { default: Page } = loadTs('src/app/(site)/services/home-health-aide/page.tsx', { mocks: {
    '@/lib/cms/read': { getSlotSafe: async key => slotByKey(key).default },
  } });
  const html = renderToStaticMarkup(await Page());
  const data = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const crumbs = data.find(x => x['@type'] === 'BreadcrumbList');
  assert.ok(crumbs);
  assert.deepEqual(crumbs.itemListElement.map(x => x.name), ['Home','Services','Home Health Aide Services']);
  assert.ok(crumbs.itemListElement[2].item.endsWith('/services/home-health-aide'));
  for (const asset of ['home-care-embroidered','home-care-cooking','home-care-walk','home-care-reminder']) assert.ok(html.includes(asset), asset);
  assert.ok(!data.find(x => x['@type'] === 'Service').areaServed);
});

function crmFixture(tables) {
  const selections = [];
  return { selections, supabase: { from(table) {
    const query = {
      select(columns) { selections.push({table,columns}); return query; },
      order() { return query; }, limit() { return query; }, eq() { return query; }, range() { return query; },
      then(resolve) { return Promise.resolve({data:tables[table] ?? [],error:null}).then(resolve); },
    };
    return query;
  }, rpc: async () => ({data:[],error:null}) } };
}

test('dashboard shows readable inquiry and booking services from the dedicated column', async () => {
  const fixture = crmFixture({
    inquiries: [{id:'i1',name:'Fixture inquiry',created_at:new Date().toISOString(),service_interested:'community-support'}],
    bookings: [{id:'b1',requested_slot:new Date(Date.now()+86400000*3).toISOString(),status:'requested',service_interested:'home-health-aide'}],
  });
  const { default: Page } = loadTs('src/app/(dashboard)/dashboard/page.tsx', { mocks: {
    '@/lib/crm/session': {getSession:async()=>({supabase:fixture.supabase,email:'fixture@example.invalid',role:'admin'})},
  } });
  const html = renderToStaticMarkup(await Page());
  assert.match(html,/Community-Based Supports/);
  assert.match(html,/Home Health Aide Services/);
  assert.doesNotMatch(html,/community-support|home-health-aide/);
  assert.ok(fixture.selections.find(s=>s.table==='bookings').columns.includes('service_interested'));
});

test('inbox reads the booking service column even when attribution contains an older different selection', async () => {
  const fixture = crmFixture({bookings:[{id:'b1',name:'Fixture booking',created_at:new Date().toISOString(),requested_slot:new Date().toISOString(),status:'requested',service_interested:'home-health-aide',attribution:{service:'respite'}}]});
  const { default: Page } = loadTs('src/app/(dashboard)/dashboard/inbox/page.tsx', {mocks:{
    '@/lib/crm/session': {getSession:async()=>({supabase:fixture.supabase,user:{id:'fixture'},role:'admin'})},
    '@/lib/supabase/read-all': {readAll:async run=>run(0,999)},
    '@/components/crm/InboxClient': {default:'inbox-fixture'},
  }});
  const view = nodes(await Page({searchParams:Promise.resolve({})})).find(n=>n.type==='inbox-fixture');
  assert.equal(view.props.conversations[0].service_interested,'home-health-aide');
});
