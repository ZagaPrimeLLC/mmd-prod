import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

function load(stored, blocked = false) {
  let writes = 0;
  const api = loadTs('src/lib/attribution.ts', {
    globals: {
      localStorage: {
        getItem() { if (blocked) throw new Error('Storage blocked'); return stored; },
        setItem() { writes++; },
      },
    },
  });
  return { api, writes: () => writes };
}

test('booking retains the original campaign and captures the current CTA without changing storage', () => {
  const { api, writes } = load(JSON.stringify({ utm_source: 'google', landing_page: '/areas/bergen', first_seen: '2026-10-01', cta: 'footer' }));
  const a = api.getBookingAttribution({ search: '?cta=home-hero&utm_source=ignored', pathname: '/contact' });
  assert.equal(a.utm_source, 'google');
  assert.equal(a.landing_page, '/areas/bergen');
  assert.equal(a.first_seen, '2026-10-01');
  assert.equal(a.cta, 'home-hero');
  assert.equal(a.conversion_page, '/contact');
  assert.equal(writes(), 0);
});

test('known service and county links are accepted; arbitrary query text is discarded', () => {
  const { api } = load(null);
  const { SERVICE_SLUGS, COUNTY_SLUGS } = loadTs('src/lib/slugs.ts');
  const { PAGE_CTAS } = loadTs('src/lib/cta.ts');
  const allowed = [...PAGE_CTAS, ...SERVICE_SLUGS.map(s => `service-${s}`), ...COUNTY_SLUGS.flatMap(c => [`areas-${c}`, `map-${c}`])];
  for (const cta of allowed) {
    assert.equal(api.getBookingAttribution({ search: `?cta=${cta}`, pathname: '/contact' }).cta, cta);
  }
  for (const cta of ['person@example.com', 'map-jane-doe', '<script>', 'home-hero-extra', 'x'.repeat(500)]) {
    assert.equal(api.getBookingAttribution({ search: `?cta=${encodeURIComponent(cta)}`, pathname: '/contact' }).cta, undefined);
  }
});

test('missing CTA never reuses an old conversion; unavailable or malformed storage does not block booking', () => {
  for (const [stored, blocked] of [[null, false], ['invalid-json', false], [null, true], [JSON.stringify({ cta: 'footer', conversion_page: '/old' }), false]]) {
    const { api } = load(stored, blocked);
    const a = api.getBookingAttribution({ search: '', pathname: '/contact' });
    assert.equal(a.cta, undefined);
    assert.equal(a.conversion_page, '/contact');
    assert.equal(api.getBookingAttribution({ search: '?cta=header', pathname: '/contact' }).cta, 'header');
  }
});

test('conversion page uses the current path, without copying query strings into analytics', () => {
  const { api } = load(null);
  const a = api.getBookingAttribution({ search: '?cta=service-respite&email=person@example.com', pathname: '/services/respite' });
  assert.equal(a.conversion_page, '/services/respite');
  assert.equal(a.cta, 'service-respite');
  assert.equal(JSON.stringify(a).includes('person@example.com'), false);
});

test('the inbox reads current or legacy CTA values using the shared allowlist', () => {
  const { storedLeadCta, ctaFromSearch } = loadTs('src/lib/cta.ts');
  assert.equal(storedLeadCta('header', { cta: 'footer' }), 'header');
  assert.equal(storedLeadCta(null, { cta: 'service-respite' }), 'service-respite');
  assert.equal(storedLeadCta('person@example.com', { cta: 'unknown' }), null);
  for (const malformed of [null, undefined, 'invalid', 123, [], {}]) {
    assert.equal(storedLeadCta(null, malformed), null);
  }
  assert.equal(ctaFromSearch('?cta=%20HEADER%20'), 'header');
  assert.equal(ctaFromSearch('?cta=home-community'), 'home-community');
  assert.equal(ctaFromSearch('?cta=person%40example.com'), null);
});
