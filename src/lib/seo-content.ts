import type { PhotoKey } from '@/lib/photos';
import type { DddServiceSlug } from '@/lib/slugs';
import { COUNTY_SLUGS } from '@/lib/slugs';
/**
 * Content for the service, guide and county pages. Service names follow the NJ
 * Division of Developmental Disabilities' own vocabulary, because that is what
 * families and support coordinators search for.
 *
 * Accuracy rule: where DDD rules vary by program or person, the copy says so and
 * points to the support coordinator instead of guessing.
 */

export type Faq = { q: string; a: string };

export type DddService = {
  slug: DddServiceSlug;
  /** The page the old /services anchors pointed at, kept for redirects. */
  legacySlug: string;
  name: string;
  /** What people also call it, used in copy and keywords. */
  aka: string[];
  title: string;
  metaDescription: string;
  lead: string;
  body: string[];
  helpsWith: string[];
  goodFitIf: string[];
  /** The photograph for this service (see lib/photos). */
  photo: PhotoKey;
  image: string;
  imageAlt: string;
  faqs: Faq[];
};

export const DDD_SERVICES: DddService[] = [
  {
    slug: 'community-based-supports',
    legacySlug: 'community-support',
    name: 'Community-Based Supports',
    aka: ['community support', 'CBS', 'one-to-one community support'],
    title: 'Community-Based Supports in New Jersey',
    metaDescription:
      'DDD Community-Based Supports (CBS) for adults with developmental disabilities across New Jersey: one-to-one support at home and in the community from trained Direct Support Professionals.',
    lead: 'One-to-one support to take part in community life: errands, activities, appointments and the places that matter to the person.',
    body: [
      'Community-Based Supports, often shortened to CBS, is one-to-one support delivered in the person’s home and out in the community. The aim is participation, not just presence: getting to the gym, the library, a job interest, a class or a friend’s house, with the right level of help alongside.',
      'Every plan starts from the goals in the person’s Individualized Service Plan. Our Direct Support Professionals work towards those goals in ordinary settings, building skills and confidence a step at a time, and they record progress so the family and support coordinator can see it.',
    ],
    helpsWith: [
      'Community outings, activities and social connection',
      'Travel training and getting around safely',
      'Shopping, banking and everyday errands',
      'Building daily living and self-care skills',
      'Getting to appointments and keeping routines',
    ],
    goodFitIf: [
      'The person wants to do more outside the home',
      'Goals in the service plan involve independence or community inclusion',
      'The family wants reliable support from trained, checked staff',
    ],
    photo: 'grocery',
    image: '/img/refresh/grocery-v2.webp',
    imageAlt: 'An MMD Direct Support Professional choosing fruit with a client at the grocery store',
    faqs: [
      { q: 'Who pays for Community-Based Supports?', a: 'For people eligible for NJ Division of Developmental Disabilities services, CBS is funded through the person’s DDD budget. Your support coordinator confirms what your budget and program include.' },
      { q: 'Can support happen at home as well as in the community?', a: 'Yes. Support can take place at home and in the community, following the goals in the person’s service plan.' },
      { q: 'Who will be coming to support my family member?', a: 'A trained, background checked Direct Support Professional matched to the person’s needs and schedule. We tell you who is coming and when, and you can call the office with any questions.' },
      { q: 'How do we start?', a: 'Tell your DDD support coordinator you would like MMD Community Care as your provider, or call us first and we will explain the next steps.' },
    ],
  },
  {
    slug: 'individual-supports',
    legacySlug: 'individual-support',
    name: 'Individual Supports',
    aka: ['individual support', 'in-home support', 'personal support'],
    title: 'Individual Supports for Adults in New Jersey',
    metaDescription:
      'DDD Individual Supports across New Jersey: trained, background-checked Direct Support Professionals helping adults with developmental disabilities with daily living, safety and independence.',
    lead: 'Hands-on support for adults who need a trained person beside them, at home and through the day.',
    body: [
      'Individual Supports help a person with the everyday things that make a day work: personal care, meals, routines, safety and the skills to do more for themselves. Some people need a little help at a few points in the day; others need someone alongside for longer.',
      'We build support around the person: their routine, how they communicate, what they already manage on their own, and what they want to keep doing for themselves.',
    ],
    helpsWith: [
      'Personal care and daily living',
      'Meal planning and preparation',
      'Medication reminders',
      'Household routines and organisation',
      'Skill building towards independence',
    ],
    goodFitIf: [
      'The person needs regular, hands-on help to stay safe and well',
      'The family wants a trained professional for daily routines',
      'Building independence at home is a goal in the service plan',
    ],
    photo: 'kitchen',
    image: '/img/refresh/kitchen-v2.webp',
    imageAlt: 'An MMD support professional cooking with a client in his kitchen',
    faqs: [
      { q: 'How are Individual Supports funded?', a: 'For people with NJ DDD services, Individual Supports are paid through the person’s DDD budget. Which services a budget covers depends on the person’s program and assessment, so your support coordinator is the one to confirm it.' },
      { q: 'Are your staff trained and background checked?', a: 'Every Direct Support Professional clears federal and New Jersey screening, fingerprinting, drug screening and Central Registry checks, completes training with the Rutgers University Boggs Center, and holds CPR and First Aid certification.' },
      { q: 'Can you help with medication?', a: 'Our Direct Support Professionals can give medication reminders as part of a person’s routine.' },
      { q: 'Do you cover my area?', a: 'MMD is a DDD approved provider serving adults across New Jersey. Call us with the person’s town and we will tell you how quickly we can staff support.' },
    ],
  },
  {
    slug: 'respite',
    legacySlug: 'respite-care',
    name: 'Respite',
    aka: ['respite care', 'caregiver respite', 'family respite'],
    title: 'Respite Care for Families in New Jersey',
    metaDescription:
      'DDD respite care across New Jersey: planned, short-term relief for family caregivers of adults with developmental disabilities, delivered by trained, familiar MMD staff.',
    lead: 'A genuine break for family caregivers, while the person you care for stays with someone trained, checked and familiar.',
    body: [
      'Caring for an adult family member is relentless, and nobody can do it without rest. Respite gives the family caregiver time back, for a few hours or a planned stretch, without a drop in the quality of support.',
      'We introduce the respite worker before support starts, so the person is not meeting a stranger on the day, and we follow an individualised plan agreed with you so the routine holds while you are away.',
    ],
    helpsWith: [
      'Short-term and scheduled breaks for caregivers',
      'Keeping the person’s routine while family are away',
      'Support at home with a familiar, trained worker',
      'An individualised plan agreed with the family',
    ],
    goodFitIf: [
      'A family caregiver needs regular time off to work, rest or travel',
      'The person does best with someone they already know',
      'Respite is part of the person’s DDD budget or plan',
    ],
    photo: 'respite-jigsaw',
    image: '/img/distinct/respite-jigsaw-v2.webp',
    imageAlt: 'A client and an MMD support professional enjoying a jigsaw puzzle together',
    faqs: [
      { q: 'Who is respite for?', a: 'Respite is for the unpaid family caregivers of an adult with a developmental disability: a short break while trained staff support the person.' },
      { q: 'Is respite covered by DDD?', a: 'Respite is a DDD service, funded through the person’s budget. Your support coordinator confirms how much is available and how to schedule it.' },
      { q: 'Will my family member meet the worker first?', a: 'Yes. We arrange an introduction before respite starts so the first visit is with a familiar face.' },
      { q: 'How far ahead should we book?', a: 'Planned respite is easiest to staff with notice. Call the office and we will work out a schedule with you.' },
    ],
  },
];

export const serviceBySlug = (slug: string) => DDD_SERVICES.find((s) => s.slug === slug);

// ─── Getting started with DDD ───────────────────────────────────────────────

export const GETTING_STARTED = [
  {
    title: 'Confirm DDD eligibility',
    body: 'You can apply for NJ DDD eligibility from age 18; DDD services generally begin at age 21 or older. The State reviews a developmental disability that began before age 22 and other eligibility requirements. Medicaid (NJ FamilyCare) eligibility is also required for DDD-funded services.',
  },
  {
    title: 'Get a support coordinator',
    body: 'Follow DDD’s instructions to select a support coordination agency. Your support coordinator helps develop the service plan, connect you with providers and monitor services. Use the State provider search to compare agencies serving your county.',
  },
  {
    title: 'Complete the assessment and plan',
    body: 'An assessment (the NJ Comprehensive Assessment Tool, or NJ CAT) helps set the person’s budget. With the support coordinator, the family completes a person-centered plan that becomes the Individualized Service Plan.',
  },
  {
    title: 'Choose MMD as your provider',
    body: 'Tell your support coordinator you would like MMD Community Care for Community-Based Supports, Individual Supports or Respite. They send the referral; you can also call us first with any questions.',
  },
  {
    title: 'Meet us and start support',
    body: 'We talk through goals and routines, match a trained Direct Support Professional, and arrange an introduction before support begins.',
  },
];

export const GETTING_STARTED_FAQS: Faq[] = [
  { q: 'Do we need a support coordinator before contacting MMD?', a: 'No. You are welcome to call us first. To start DDD-funded services, your support coordinator will need to send us a referral, and we can explain how that works.' },
  { q: 'What if the person is not yet registered with DDD?', a: 'Start with the NJ Division of Developmental Disabilities eligibility process. The Division’s website lists the steps and the documents needed.' },
  { q: 'Can we change provider later?', a: 'Families can choose and change providers with the help of their support coordinator.' },
  { q: 'Is there a cost to talk to you?', a: 'No. Consultations are free. Contact us to arrange a conversation about the support you need.' },
];

export const HOME_FAQS: Faq[] = [
  { q: 'Is MMD Community Care an approved DDD provider?', a: 'Yes. MMD Community Care is approved by the New Jersey Division of Developmental Disabilities as a statewide provider of Community-Based Supports, Individual Supports and Respite for adults.' },
  { q: 'Where are your DDD services available?', a: 'We serve adults across New Jersey from our office in South Plainfield, Middlesex County. Call us with the town and we will confirm how quickly we can staff support.' },
  { q: 'How do we start DDD services?', a: 'Tell your DDD support coordinator you would like MMD as your provider, or book a free consultation and we will walk you through it.' },
  { q: 'How are your Direct Support Professionals trained?', a: 'Every Direct Support Professional clears federal and New Jersey screening, fingerprinting, drug screening and Central Registry checks, trains with the Rutgers University Boggs Center, and holds CPR and First Aid certification.' },
];

// ─── County pages ──────────────────────────────────────────────────────────

export type Area = {
  slug: string;   // matches NJ_COUNTIES slug
  name: string;   // county name without "County"
  towns: string[];
  intro: string;
  /** Words used in job locations that mean this county. */
  jobMatch: string[];
};

export const AREAS: Area[] = [
  {
    slug: 'middlesex',
    name: 'Middlesex',
    towns: ['South Plainfield', 'Edison', 'New Brunswick', 'Piscataway', 'Woodbridge', 'East Brunswick', 'Perth Amboy', 'Sayreville', 'Old Bridge'],
    intro: 'We support adults across Middlesex County, from South Plainfield and Edison to New Brunswick, with services built around their routines, interests and goals.',
    jobMatch: ['middlesex', 'south plainfield', 'edison', 'new brunswick', 'piscataway', 'woodbridge', 'east brunswick', 'perth amboy', 'sayreville', 'old bridge'],
  },
  {
    slug: 'union',
    name: 'Union',
    towns: ['Plainfield', 'Elizabeth', 'Union', 'Linden', 'Westfield', 'Rahway', 'Scotch Plains', 'Cranford'],
    intro: 'Union County sits right next to our South Plainfield office, so Plainfield, Scotch Plains and the surrounding towns are a short trip for our team.',
    jobMatch: ['union county', 'union', 'plainfield', 'elizabeth', 'linden', 'westfield', 'rahway', 'scotch plains', 'cranford'],
  },
  {
    slug: 'somerset',
    name: 'Somerset',
    towns: ['Bridgewater', 'Somerville', 'Franklin Township', 'Hillsborough', 'Bound Brook', 'North Plainfield', 'Branchburg'],
    intro: 'Somerset County borders our office in South Plainfield, and we support adults from North Plainfield out to Hillsborough and Branchburg.',
    jobMatch: ['somerset', 'bridgewater', 'somerville', 'franklin', 'hillsborough', 'bound brook', 'north plainfield', 'branchburg'],
  },
  {
    slug: 'monmouth',
    name: 'Monmouth',
    towns: ['Middletown', 'Freehold', 'Howell', 'Long Branch', 'Red Bank', 'Neptune', 'Asbury Park', 'Marlboro'],
    intro: 'In Monmouth County we support adults and families from Middletown and Red Bank down to Freehold, Howell and the shore towns.',
    jobMatch: ['monmouth', 'middletown', 'freehold', 'howell', 'long branch', 'red bank', 'neptune', 'asbury park', 'marlboro'],
  },
  {
    slug: 'hudson',
    name: 'Hudson',
    towns: ['Jersey City', 'Hoboken', 'Bayonne', 'Union City', 'North Bergen', 'West New York', 'Kearny'],
    intro: 'In Hudson County our Direct Support Professionals work across Jersey City, Bayonne, Hoboken and the surrounding neighbourhoods, where getting around by bus, light rail and on foot is part of everyday support.',
    jobMatch: ['hudson', 'jersey city', 'hoboken', 'bayonne', 'union city', 'north bergen', 'west new york', 'kearny'],
  },
  {
    slug: 'bergen',
    name: 'Bergen',
    towns: ['Hackensack', 'Lodi', 'Paramus', 'Teaneck', 'Fort Lee', 'Englewood', 'Garfield'],
    intro: 'In Bergen County we support adults in Lodi, Hackensack, Paramus and the towns around them.',
    jobMatch: ['bergen', 'hackensack', 'lodi', 'paramus', 'teaneck', 'fort lee', 'englewood', 'garfield'],
  },
  {
    slug: 'essex',
    name: 'Essex',
    towns: ['Newark', 'East Orange', 'Irvington', 'Bloomfield', 'Montclair', 'West Orange', 'Belleville'],
    intro: 'In Essex County we support adults across Newark, the Oranges, Bloomfield and Montclair.',
    jobMatch: ['essex', 'newark', 'east orange', 'irvington', 'bloomfield', 'montclair', 'west orange', 'belleville'],
  },
  {
    slug: 'warren',
    name: 'Warren',
    towns: ['Washington', 'Phillipsburg', 'Hackettstown', 'Belvidere', 'Blairstown'],
    intro: 'In rural Warren County, where services can be far apart, we support adults in Washington, Phillipsburg, Hackettstown and the surrounding townships.',
    jobMatch: ['warren', 'washington', 'phillipsburg', 'hackettstown', 'belvidere', 'blairstown'],
  },
];

export const areaBySlug = (slug: string) => AREAS.find((a) => a.slug === slug);

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Recognize every NJ county, including counties without an area landing page.
// An explicit county must never be overridden by a town with a familiar name.
const COUNTY_TERMS = COUNTY_SLUGS.map((slug) => ({
  slug, pattern: new RegExp(`\\b${escapeRe(slug.replaceAll('-', ' '))}\\s+county\\b`),
}));
// These names cannot identify a county on their own. Ask for the county in
// the job location instead of silently assigning a similarly named township.
const AMBIGUOUS_PLACES = new Set(['washington', 'franklin', 'union', 'warren']);
const PLACE_TERMS = AREAS.flatMap((area) => area.jobMatch
  .filter((term) => !AMBIGUOUS_PLACES.has(term))
  .map((term) => ({
    area, pattern: new RegExp(`^${escapeRe(term)}(?: (?:township|twp\\.?|borough|boro\\.?|city|town))?$`),
  })));

/** The county page a job location belongs to, or undefined when it names none of them. */
export function areaForLocation(location: string | null | undefined): Area | undefined {
  const where = (location ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const counties = COUNTY_TERMS.filter(({ pattern }) => pattern.test(where));
  if (counties.length) return counties.length === 1 ? areaBySlug(counties[0].slug) : undefined;

  // Match the complete locality, not a substring of another municipality.
  const locality = where.split(',')[0].replace(/\s+(?:nj|new jersey)(?:\s+\d{5}(?:-\d{4})?)?$/, '').trim();
  const matches = PLACE_TERMS.filter(({ pattern }) => pattern.test(locality));
  const slugs = new Set(matches.map(({ area }) => area.slug));
  return slugs.size === 1 ? matches[0].area : undefined;
}

export function areaFaqs(a: Area): Faq[] {
  return [
    { q: `Do you provide DDD services in ${a.name} County?`, a: `Yes. MMD Community Care provides Community-Based Supports, Individual Supports and Respite to adults in ${a.name} County, including ${a.towns.slice(0, 4).join(', ')} and nearby towns.` },
    { q: `Are Home Health Aide Services available in ${a.name} County?`, a: 'Contact us directly with your town or ZIP code, the support needed and your preferred schedule. Our team will confirm Home Health Aide Services availability and discuss the next steps. Home care follows a separate process from DDD services.' },
    { q: `How do we start DDD services in ${a.name} County?`, a: 'Tell your DDD support coordinator you would like MMD Community Care as your provider, or call us first and we will explain the next steps. Consultations are free.' },
    { q: `Are you hiring in ${a.name} County?`, a: `We hire Direct Support Professionals for cases across New Jersey, including ${a.name} County. Current openings are listed on this page and on our careers page.` },
  ];
}
