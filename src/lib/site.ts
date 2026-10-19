export const site = {
  name: 'MMD Community Care',
  legalName: 'MMD Community Care LLC',
  tagline: 'Serving Adults With Special Needs',
  // the slogan is set into the agency's own shield logo
  slogan: 'Serving Adults with Special Needs',
  description:
    'MMD Community Care provides Home Health Aide Services for adults and seniors in New Jersey, alongside statewide NJ DDD Community-Based Supports, Individual Supports and Respite.',
  phone: '(732) 801-7683',
  phoneHref: 'tel:+17328017683',
  email: 'info@mmdcommunitycare.com',
  address: { street: '2950 Hamilton Blvd', city: 'South Plainfield', state: 'NJ', zip: '07080' },
  // Set at build time in next.config.mjs (Vercel's production domain).
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mmd-prod.vercel.app',
  logo: '/brand/mmd-logo.png',
  // Maps search by business name and address; this does not establish profile verification.
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=MMD+Community+Care+LLC%2C+2950+Hamilton+Blvd%2C+South+Plainfield%2C+NJ+07080',
  directionsUrl: 'https://www.google.com/maps/dir/?api=1&destination=MMD+Community+Care+LLC%2C+2950+Hamilton+Blvd%2C+South+Plainfield%2C+NJ+07080',
  mapEmbedUrl: 'https://www.google.com/maps?q=MMD+Community+Care+LLC%2C+2950+Hamilton+Blvd%2C+South+Plainfield%2C+NJ+07080&z=15&output=embed',
  /** Where every mention of the office links to: the map on the contact page. */
  officeHref: '/contact#visit',
} as const;

// Verbatim in substance from the existing Services page. Compliance-relevant: do not trim.
// Onboarding checks every DSP clears before working a case. Stated on the
// current site and compliance-relevant, so kept verbatim in substance.
export const onboardingChecks = [
  'Federal and New Jersey State screening processes',
  'Fingerprinting',
  'Drug screening',
  'Interview',
  'Online training with Rutgers University Boggs Center',
  'CPR and First Aid certification',
  'Central Registry of Offenders verification',
  'Ongoing staff training',
  'Training on the latest changes from NJ DDD',
] as const;

export const values = [
  ['Compassionate Care', 'We provide care with kindness, empathy and understanding.'],
  ['Client-Centered Approach', "We focus on each client's needs, goals and preferences, and work with them to achieve them."],
  ['Professionalism', 'We hold to the highest standards of professionalism, ethics and integrity.'],
  ['Respect', 'We treat our clients with respect and dignity, and honour their choices.'],
  ['Continuous Improvement', 'We continuously improve our services to meet the changing needs of our clients.'],
] as const;

// No testimonials are published until MMD has real, permissioned words from
// families or staff. Never add invented quotes here: publishing them as genuine
// reviews is deceptive (FTC rule on fake reviews, 16 CFR 465).

/**
 * Dates and contacts used by the legal and compliance pages.
 * Anything marked "confirm" is shown highlighted on the page until MMD fills it in.
 */
export const legal = {
  effective: 'September 29, 2026',
  privacyOfficer: {
    name: '[MMD to confirm the Privacy Officer name]',
    title: 'Privacy Officer',
  },
  civilRightsCoordinator: {
    name: '[MMD to confirm the Civil Rights Coordinator name]',
    title: 'Civil Rights Coordinator',
  },
  /**
   * Section 1557 requires the notice of availability in English plus the 15
   * languages most commonly spoken by people with limited English proficiency
   * in New Jersey. Confirm this list and paste the official translated taglines
   * from the HHS Office for Civil Rights before relying on it.
   */
  languages: [
    'Español (Spanish)',
    'Português (Portuguese)',
    '한국어 (Korean)',
    '中文 (Chinese)',
    'ગુજરાતી (Gujarati)',
    'हिन्दी (Hindi)',
    'Polski (Polish)',
    'العربية (Arabic)',
    'Italiano (Italian)',
    'Tagalog',
    'Русский (Russian)',
    'Kreyòl Ayisyen (Haitian Creole)',
    'اردو (Urdu)',
    'Tiếng Việt (Vietnamese)',
    'বাংলা (Bengali)',
  ],
} as const;
