import { HOME_FAQS, type Faq } from '@/lib/seo-content';
import { DEFAULT_SCHEDULE, type Schedule } from '@/lib/booking';

/**
 * The registry of editable places on the public site. Each slot has a block
 * type with a fixed shape, a built-in default (the text the site shipped with,
 * used until something is published) and the pages to refresh on publish.
 * Staff cannot add slots or inject markup; a developer registers a slot here
 * and renders it with getSlot(). Keys under `settings.` are administrator-only.
 */
/** Slot key → block type. The single source for both the keys and each slot's content shape. */
export const SLOT_TYPES = {
  'home.hero.badge': 'text',
  'home.hero.title': 'heroTitle',
  'home.hero.lead': 'text',
  'home.hero.cta_primary': 'cta',
  'home.hero.cta_secondary': 'cta',
  'home.hero.trust': 'list',
  'home.intro.statement': 'text',
  'home.intro.paragraphs': 'paragraphs',
  'home.faq': 'faq',
  'global.announcement': 'announcement',
  'settings.office_hours': 'schedule',
} as const;
export type SlotKey = keyof typeof SLOT_TYPES;
export type SlotType<K extends SlotKey> = (typeof SLOT_TYPES)[K];

export type Content = {
  text: { text: string };
  paragraphs: { paragraphs: string[] };
  heroTitle: { lead: string; accent: string };
  cta: { label: string; href: string };
  list: { items: string[] };
  faq: { items: Faq[] };
  announcement: { text: string; href: string };
  schedule: Schedule;
};
export type BlockType = keyof Content;

export type SlotDef<T extends BlockType = BlockType> = {
  key: SlotKey;
  label: string;
  group: 'Homepage' | 'Site-wide' | 'Office';
  type: T;
  help: string;
  default: Content[T];
  /** Pages whose cache is refreshed when this slot is published. */
  paths: string[];
};

const HOME = ['/'];
const ALL_PUBLIC = ['/', '/services', '/about', '/mission', '/careers', '/contact', '/areas', '/getting-started'];

export const SLOTS: SlotDef[] = [
  { key: 'home.hero.badge', label: 'Hero badge', group: 'Homepage', type: 'text', help: 'The small line above the headline.', default: { text: 'NJ DDD Approved Provider' }, paths: HOME },
  { key: 'home.hero.title', label: 'Hero headline', group: 'Homepage', type: 'heroTitle', help: 'Two parts: the white words and the gold words.', default: { lead: 'Serving Adults With', accent: 'Special Needs' }, paths: HOME },
  { key: 'home.hero.lead', label: 'Hero sentence', group: 'Homepage', type: 'text', help: 'One or two sentences under the headline.', default: { text: 'Providing exceptional community support, respite care, and individual support to adults with disabilities across the State of New Jersey.' }, paths: HOME },
  { key: 'home.hero.cta_primary', label: 'Hero button (gold)', group: 'Homepage', type: 'cta', help: 'Label and the page it opens. Links stay inside this site.', default: { label: 'Book a Consultation', href: '/contact?cta=home-hero#book' }, paths: HOME },
  { key: 'home.hero.cta_secondary', label: 'Hero button (outlined)', group: 'Homepage', type: 'cta', help: 'Label and the page it opens.', default: { label: 'Our Services', href: '/services' }, paths: HOME },
  { key: 'home.hero.trust', label: 'Hero trust line', group: 'Homepage', type: 'list', help: 'Three short phrases shown with icons under the buttons.', default: { items: ['Compassionate Care', 'DDD Certified', 'Statewide Service'] }, paths: HOME },
  { key: 'home.intro.statement', label: 'Intro statement', group: 'Homepage', type: 'text', help: 'The large sentence that opens the introduction.', default: { text: 'Trained, checked support professionals for adults with developmental disabilities, at home and out in the community.' }, paths: HOME },
  { key: 'home.intro.paragraphs', label: 'Intro paragraphs', group: 'Homepage', type: 'paragraphs', help: 'The paragraphs that follow. The office address line is added automatically.', default: { paragraphs: [
    'MMD Community Care is approved by the New Jersey Division of Developmental Disabilities to support adults at home and in the community, in every county in New Jersey.',
    'Every Direct Support Professional is fingerprinted, background checked and screened against the Central Registry, trained with the Rutgers University Boggs Center, and certified in CPR and First Aid before their first visit.',
  ] }, paths: HOME },
  { key: 'home.faq', label: 'Homepage questions', group: 'Homepage', type: 'faq', help: 'Questions and answers shown near the end of the homepage. Also published to Google as FAQ data.', default: { items: HOME_FAQS }, paths: HOME },
  { key: 'global.announcement', label: 'Announcement bar', group: 'Site-wide', type: 'announcement', help: 'A short notice at the top of every public page, for example a holiday closure. Leave the text empty to hide the bar.', default: { text: '', href: '' }, paths: ALL_PUBLIC },
  { key: 'settings.office_hours', label: 'Walk-in and consultation hours', group: 'Office', type: 'schedule', help: 'Days and hours the office takes walk-ins and consultations, plus one-off closed dates. Automatic federal holiday closures: New Year’s Day, Martin Luther King Jr. Day, Presidents’ Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving and Christmas Day. Fixed-date holidays are also observed on Friday when they fall on Saturday, or Monday when they fall on Sunday. Company closures: Christmas Eve and New Year’s Eve. Administrators only.', default: DEFAULT_SCHEDULE, paths: ALL_PUBLIC },
];

for (const def of SLOTS) {
  if (SLOT_TYPES[def.key] !== def.type) throw new Error(`cms: slot ${def.key} is registered as ${def.type} but typed as ${SLOT_TYPES[def.key]}`);
}
for (const key of Object.keys(SLOT_TYPES)) {
  if (!SLOTS.some((d) => d.key === key)) throw new Error(`cms: slot ${key} is typed but not registered`);
}

export const slotByKey = (key: string) => SLOTS.find((s) => s.key === key);
export const isProtected = (key: string) => key.startsWith('settings.');

const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');
const lines = (s: unknown, n: number, max: number) => clip(s, 20_000).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, n).map((x) => x.slice(0, max));
const INTERNAL_HREF = /^(\/(?!\/|dashboard|api)[A-Za-z0-9/_?=&#%.-]*|tel:[0-9+().\s-]{5,30}|mailto:[^\s]{3,120})$/;

/**
 * Turns raw input (form fields or a stored row) into valid content for the
 * slot's type, or returns the reason it is not valid. Nothing unvalidated is
 * ever rendered.
 */
export function validate(type: BlockType, raw: unknown): { ok: true; content: Content[BlockType] } | { ok: false; error: string } {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  switch (type) {
    case 'text': {
      const text = clip(r.text, 400);
      return text ? { ok: true, content: { text } } : { ok: false, error: 'Text is required.' };
    }
    case 'heroTitle': {
      const lead = clip(r.lead, 80), accent = clip(r.accent, 60);
      return lead ? { ok: true, content: { lead, accent } } : { ok: false, error: 'The headline needs its first part.' };
    }
    case 'cta': {
      const label = clip(r.label, 60), href = clip(r.href, 200);
      if (!label) return { ok: false, error: 'The button needs a label.' };
      if (!INTERNAL_HREF.test(href)) return { ok: false, error: 'The link must be a page on this site (starting with /), a tel: or a mailto: address.' };
      return { ok: true, content: { label, href } };
    }
    case 'paragraphs': {
      const list = Array.isArray(r.paragraphs) ? r.paragraphs.map((x) => clip(x, 1200)).filter(Boolean) : clip(r.paragraphs, 20_000).split(/\n\s*\n/).map((x) => x.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
      const paragraphs = list.slice(0, 8);
      return paragraphs.length ? { ok: true, content: { paragraphs } } : { ok: false, error: 'Add at least one paragraph.' };
    }
    case 'list': {
      const items = Array.isArray(r.items) ? r.items.map((x) => clip(x, 60)).filter(Boolean).slice(0, 6) : lines(r.items, 6, 60);
      return items.length ? { ok: true, content: { items } } : { ok: false, error: 'Add at least one item, one per line.' };
    }
    case 'faq': {
      let items: Faq[] = [];
      if (Array.isArray(r.items)) {
        items = r.items.map((x) => ({ q: clip((x as Faq)?.q, 200), a: clip((x as Faq)?.a, 1500) })).filter((x) => x.q && x.a);
      } else {
        for (const block of clip(r.items, 40_000).split(/\n\s*\n/)) {
          const q = /^\s*Q:\s*(.+)$/m.exec(block)?.[1]?.trim().slice(0, 200);
          const a = /^\s*A:\s*([\s\S]+)$/m.exec(block)?.[1]?.replace(/\s*\n\s*/g, ' ').trim().slice(0, 1500);
          if (q && a) items.push({ q, a });
        }
      }
      items = items.slice(0, 12);
      return items.length ? { ok: true, content: { items } } : { ok: false, error: 'Write each question as "Q: …" and its answer as "A: …", separated by a blank line.' };
    }
    case 'announcement': {
      const text = clip(r.text, 160), href = clip(r.href, 200);
      if (href && !INTERNAL_HREF.test(href)) return { ok: false, error: 'The link must be a page on this site (starting with /).' };
      return { ok: true, content: { text, href: text ? href : '' } };
    }
    case 'schedule': {
      const days = (Array.isArray(r.days) ? r.days : []).map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
      const toMin = (v: unknown) => {
        if (typeof v === 'number') return Number.isInteger(v) && v >= 0 && v <= 24 * 60 ? v : NaN;
        const m = /^(\d{1,2}):(\d{2})$/.exec(clip(v, 5));
        if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return NaN;
        return Number(m[1]) * 60 + Number(m[2]);
      };
      const start = toMin(r.start), end = toMin(r.end);
      const closed = (Array.isArray(r.closed) ? r.closed.map((x) => clip(x, 10)) : lines(r.closed, 60, 10)).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
      if (!days.length) return { ok: false, error: 'Choose at least one day.' };
      if (!(start >= 0 && end <= 24 * 60 && end - start >= 45)) return { ok: false, error: 'Hours must allow at least one 45-minute consultation.' };
      return { ok: true, content: { days: [...new Set(days)].sort(), start, end, closed: [...new Set(closed)].sort() } };
    }
  }
}
