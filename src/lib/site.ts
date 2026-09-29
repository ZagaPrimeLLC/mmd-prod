export const site = {
  name: 'MMD Community Care',
  legalName: 'MMD Community Care LLC',
  tagline: 'Serving Adults With Special Needs.',
  description:
    'MMD Community Care is a New Jersey DDD (Division of Developmental Disabilities) approved statewide provider of community support, Respite and Individual Support for adults with disabilities.',
  phone: '(732) 801-7683',
  phoneHref: 'tel:+17328017683',
  email: 'info@mmdcommunitycare.com',
  address: { street: '2950 Hamilton Blvd', city: 'South Plainfield', state: 'NJ', zip: '07080' },
  walkIn: 'Tuesdays and Thursdays, 11am to 4pm',
  url: 'https://www.mmdcommunitycare.com',
} as const;

export const services = [
  {
    slug: 'individual-support',
    name: 'Individual Support',
    summary:
      'For clients who need more intensive support, our Direct Support Professionals keep them safe, comfortable and well supported.',
  },
  {
    slug: 'respite-care',
    name: 'Respite Care',
    summary:
      'Temporary relief and specialised attention for your loved one, with an individualised care plan, so primary caregivers get a genuine break.',
  },
  {
    slug: 'community-support',
    name: 'Community Support',
    summary:
      'Personalised care tailored to each client, with a team available around the clock to provide the assistance you need.',
  },
] as const;

// Verbatim in substance from the existing Services page. Compliance-relevant: do not trim.
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
