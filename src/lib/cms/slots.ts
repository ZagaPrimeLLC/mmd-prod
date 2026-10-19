import { HOME_CARE } from '@/lib/home-care';
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
  'home.approach.headline': 'text',
  'home.approach.description': 'text',
  'home.approach.highlights': 'highlights',
  'home.approach.cta': 'cta',
  'home.ribbon.messages': 'list',
  'home.faq': 'faq',
  'homecare.feature.headline': 'text',
  'homecare.feature.description': 'text',
  'homecare.hero.headline': 'text',
  'homecare.hero.lead': 'text',
  'homecare.support': 'highlights',
  'homecare.schedules': 'highlights',
  'homecare.steps': 'highlights',
  'homecare.faq': 'faq',
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
  highlights: { items: { title: string; body: string }[] };
  faq: { items: Faq[] };
  announcement: { text: string; href: string };
  schedule: Schedule;
};
export type BlockType = keyof Content;

export type SlotDef<T extends BlockType = BlockType> = {
  key: SlotKey;
  label: string;
  group: 'Homepage' | 'Home Care' | 'Site-wide' | 'Office';
  type: T;
  help: string;
  default: Content[T];
  /** Pages whose cache is refreshed when this slot is published. */
  paths: string[];
};

const HOME = ['/'];
const ALL_PUBLIC = ['/', '/services', '/about', '/mission', '/careers', '/contact', '/areas', '/getting-started'];

export const SLOTS: SlotDef[] = [
  { key: 'homecare.feature.headline', label: 'Home-care feature: headline', group: 'Home Care', type: 'text', help: 'Short headline beside the photo on Home and Services. Aim for two short phrases; keep the service name in the introduction.', default: {"text":"A helping hand. The comfort of home."}, paths: ["/","/services"] },
  { key: 'homecare.feature.description', label: 'Home-care feature: introduction', group: 'Home Care', type: 'text', help: 'One or two sentences introducing Home Health Aide Services for adults and seniors. Shown on Home and Services; keep location and payment promises specific.', default: {"text":"Home Health Aide Services for adults and seniors. Personal care, companionship and help with everyday routines, in the comfort of home."}, paths: ["/","/services"] },
  { key: 'homecare.hero.headline', label: 'Home-care page: headline', group: 'Home Care', type: 'text', help: 'Main heading on the Home Health Aide Services page. Keep it brief enough to read comfortably on a phone.', default: { text: HOME_CARE.headline }, paths: ["/services/home-health-aide"] },
  { key: 'homecare.hero.lead', label: 'Home-care page: introduction', group: 'Home Care', type: 'text', help: 'Opening paragraph on the home-care page: who the service helps and the everyday support offered. Maximum 400 characters.', default: { text: HOME_CARE.introduction }, paths: ["/services/home-health-aide"] },
  { key: 'homecare.support', label: 'Home-care page: three support areas', group: 'Home Care', type: 'highlights', help: 'Three support areas, each with a heading (60 characters) and description (180 characters). Describe personal care, household help and companionship.', default: { items: HOME_CARE.support.map(x => ({ ...x })) }, paths: ["/services/home-health-aide"] },
  { key: 'homecare.schedules', label: 'Home-care page: care arrangements', group: 'Home Care', type: 'highlights', help: 'Three care arrangements, each with a heading (60 characters) and description (180 characters). State availability clearly and distinguish live-in rest periods from continuous awake coverage.', default: { items: HOME_CARE.schedules.map(x => ({ ...x })) }, paths: ["/services/home-health-aide"] },
  { key: 'homecare.steps', label: 'Home-care page: getting started', group: 'Home Care', type: 'highlights', help: 'Three steps in order, from the first conversation through planning to arranging support. Each needs a heading (60 characters) and description (180 characters).', default: { items: HOME_CARE.steps.map(x => ({ ...x })) }, paths: ["/services/home-health-aide"] },
  { key: 'homecare.faq', label: 'Home-care page: questions', group: 'Home Care', type: 'faq', help: 'Questions and answers about home-care eligibility, medication reminders, schedules, coverage and payment. Separate DDD requirements and avoid promising unconfirmed clinical services.', default: { items: HOME_CARE.faqs.map(x => ({ ...x })) }, paths: ["/services/home-health-aide"] },
  { key: 'home.hero.badge', label: 'Hero badge', group: 'Homepage', type: 'text', help: 'The small line above the headline.', default: { text: 'NJ DDD Approved Provider' }, paths: HOME },
  { key: 'home.hero.title', label: 'Hero headline', group: 'Homepage', type: 'heroTitle', help: 'Two parts: the white words and the gold words.', default: { lead: 'Serving Adults With', accent: 'Special Needs' }, paths: HOME },
  { key: 'home.hero.lead', label: 'Hero sentence', group: 'Homepage', type: 'text', help: 'One or two sentences under the headline.', default: { text: 'Home Health Aide Services for adults and seniors, alongside Community-Based Supports, Individual Supports and Respite for adults with developmental disabilities in New Jersey.' }, paths: HOME },
  { key: 'home.hero.cta_primary', label: 'Hero button (gold)', group: 'Homepage', type: 'cta', help: 'Label and the page it opens. Links stay inside this site.', default: { label: 'Book a Consultation', href: '/contact?cta=home-hero#book' }, paths: HOME },
  { key: 'home.hero.cta_secondary', label: 'Hero button (outlined)', group: 'Homepage', type: 'cta', help: 'Label and the page it opens.', default: { label: 'Our Services', href: '/services' }, paths: HOME },
  { key: 'home.hero.trust', label: 'Hero trust line', group: 'Homepage', type: 'list', help: 'Three short phrases shown with icons under the buttons.', default: { items: ['Personalized care', 'Home Health Aide Services', 'NJ DDD approved provider'] }, paths: HOME },
  // The redesigned approach has its own slots. Revisions of the former
  // home.intro.* slots stay in the database without overriding this layout.
  { key: 'home.approach.headline', label: 'Our approach: headline', group: 'Homepage', type: 'text', help: 'A short headline beside the community illustration. Keep visiting information on Contact.', default: { text: 'More independence. More everyday possibilities.' }, paths: HOME },
  { key: 'home.approach.description', label: 'Our approach: introduction', group: 'Homepage', type: 'text', help: 'One short paragraph about the support we provide. No office address or visiting hours.', default: { text: 'Support for adults with developmental disabilities, shaped around their routines, interests and goals—at home and throughout New Jersey communities.' }, paths: HOME },
  { key: 'home.approach.highlights', label: 'Our approach: three highlights', group: 'Homepage', type: 'highlights', help: 'Three brief benefits, each with a heading and a sentence.', default: { items: [
    { title: 'Everyday confidence', body: 'Support with familiar routines and new skills.' },
    { title: 'Community connections', body: 'Help taking part in activities that matter.' },
    { title: 'Support that fits', body: 'Built around the person, their preferences and the care they need.' },
  ] }, paths: HOME },
  { key: 'home.approach.cta', label: 'Our approach: link', group: 'Homepage', type: 'cta', help: 'The link beneath the three highlights.', default: { label: 'Explore our approach', href: '/about' }, paths: HOME },
  { key: 'home.ribbon.messages', label: 'Scrolling information banner', group: 'Homepage', type: 'list', help: 'Up to six short messages beneath the hero. No addresses or walk-in information; those belong on Contact.', default: { items: ['Home Health Aide Services', 'Community-Based Supports', 'Individual Supports', 'Respite care', 'Serving New Jersey', 'Support built around you'] }, paths: HOME },
  { key: 'home.faq', label: 'Home care and DDD questions', group: 'Homepage', type: 'faq', help: 'Questions and answers shown near the end of the homepage. Also published to Google as FAQ data.', default: { items: [HOME_CARE.faqs[0], HOME_CARE.faqs[1], HOME_CARE.faqs[5], ...HOME_FAQS] }, paths: HOME },
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
    case 'highlights': {
      if (!Array.isArray(r.items) || r.items.length !== 3) return { ok: false, error: 'Add exactly three items, each with a heading and a short description.' };
      const items = r.items.map((item: unknown) => {
        const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        return { title: clip(row.title, 60), body: clip(row.body, 180) };
      });
      return items.every((item) => item.title && item.body)
        ? { ok: true, content: { items } }
        : { ok: false, error: 'Each item needs a heading and a short description.' };
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
