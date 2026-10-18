import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs } from './helpers/load-ts.mjs';

const { areaForLocation } = loadTs('src/lib/seo-content.ts');
const county = location => areaForLocation(location)?.slug;

test('county names override ambiguous municipalities, including counties without a landing page', () => {
  const cases = [
    ['Washington Township, Bergen County', 'bergen'],
    ['Washington Township, Morris County', undefined],
    ['Franklin Township, Gloucester County', undefined],
    ['Warren Township, Somerset County', 'somerset'],
    ['Union Township, Hunterdon County', undefined],
    ['South Plainfield, Middlesex County', 'middlesex'],
    ['Bergen County and Hudson County', undefined],
  ];
  for (const [location, expected] of cases) assert.equal(county(location), expected, location);
});

test('whole locality matching separates similarly named towns', () => {
  const cases = [
    ['South Plainfield, NJ', 'middlesex'], ['North Plainfield, NJ', 'somerset'],
    ['Plainfield, NJ', 'union'], ['North Bergen, NJ', 'hudson'],
    ['Union City, NJ', 'hudson'], ['Bergen County', 'bergen'],
    ['Edison NJ 08817', 'middlesex'], ['  SOUTH   PLAINFIELD , NJ', 'middlesex'],
    ['Middlesex', 'middlesex'], ['Franklin Lakes, NJ', undefined],
    ['West New York, NJ', 'hudson'], ['Newark, NJ', 'essex'],
  ];
  for (const [location, expected] of cases) assert.equal(county(location), expected, location);
});

test('ambiguous and unknown locations are not guessed into a county', () => {
  for (const location of [null, undefined, '', 'New Jersey', 'Washington, NJ', 'Washington Township, NJ', 'Franklin Township, NJ', 'Warren Township, NJ', 'Union Township, NJ']) {
    assert.equal(county(location), undefined, String(location));
  }
});

test('booking availability and walk-in status agree on holidays and one-off closures', () => {
  const booking = loadTs('src/lib/booking.ts');
  const S = booking.DEFAULT_SCHEDULE;
  const { walkInText } = loadTs('src/components/site/WalkInStatus.tsx', { mocks: { '@/lib/booking': booking } });
  assert.equal(walkInText(new Date('2026-10-20T16:00:00Z'), S).open, true);
  booking.CLOSED_DATES.push('2026-10-20');
  assert.equal(walkInText(new Date('2026-10-20T16:00:00Z'), S).open, false);
  assert.match(walkInText(new Date('2026-10-20T16:00:00Z'), S).text, /Thursday/);
  assert.equal(booking.availableDays(new Date('2026-10-18T16:00:00Z'), S).some(d => d.key === '2026-10-20'), false);
  assert.equal(walkInText(new Date('2026-11-26T17:00:00Z'), S).open, false);
  assert.equal(booking.availableDays(new Date('2026-11-24T12:00:00Z'), S).some(d => d.key === '2026-11-26'), false);
});

test('walk-in boundaries use New York time across daylight-saving changes', () => {
  const { walkInText } = loadTs('src/components/site/WalkInStatus.tsx');
  const S = loadTs('src/lib/booking.ts').DEFAULT_SCHEDULE;
  assert.equal(walkInText(new Date('2026-10-20T14:59:00Z'), S).open, false);
  assert.equal(walkInText(new Date('2026-10-20T15:00:00Z'), S).open, true);
  assert.equal(walkInText(new Date('2026-10-20T20:00:00Z'), S).open, false);
  assert.equal(walkInText(new Date('2026-11-03T15:59:00Z'), S).open, false);
  assert.equal(walkInText(new Date('2026-11-03T16:00:00Z'), S).open, true);
  assert.equal(walkInText(new Date('2026-11-03T21:00:00Z'), S).open, false);
});

test('public schedule text follows the configured consultation weekdays', () => {
  const booking = loadTs('src/lib/booking.ts');
  assert.equal(booking.officeHoursLabel(booking.DEFAULT_SCHEDULE), 'Tuesdays and Thursdays, 11am to 4pm');
  const schedule = { ...booking.DEFAULT_SCHEDULE, days: [1, 3] };
  const { default: WalkInStatus } = loadTs('src/components/site/WalkInStatus.tsx', { mocks: { '@/lib/booking': booking } });
  assert.equal(booking.officeHoursLabel(schedule), 'Mondays and Wednesdays, 11am to 4pm');
  assert.match(renderToStaticMarkup(React.createElement(WalkInStatus, { schedule })), /Mondays and Wednesdays/);
});

test('booking cards render their CTA for staff and omit the label when attribution is unavailable', () => {
  const { default: InboxClient } = loadTs('src/components/crm/InboxClient.tsx', {
    mocks: { '@/app/(dashboard)/dashboard/inbox/actions': {}, 'next/navigation': { useSearchParams: () => null } },
  });
  const render = cta => renderToStaticMarkup(React.createElement(InboxClient, {
    members: [], boards: [], canWrite: false, userId: null,
    conversations: [{
      key: 'booking:review-fixture', type: 'booking', id: 'review-fixture', name: 'Example booking', phone: null, email: null,
      created_at: '2026-10-16T12:00:00Z', status: 'requested', owner_id: null, starred: false, archived: false,
      preview: '', source: null, cta, source_page: '/contact', requested_slot: null, notes: null,
    }],
  }));
  assert.match(render('service-respite'), /service-respite/);
  assert.equal(render(null).includes('service-respite'), false);
});
