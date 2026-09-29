export const site = {
  name: 'MMD Community Care',
  legalName: 'MMD Community Care LLC',
  tagline: 'Serving Adults With Special Needs',
  // the slogan is set into the agency's own shield logo
  slogan: 'Serving Adults with Special Needs',
  description:
    'MMD Community Care is a New Jersey DDD (Division of Developmental Disabilities) approved statewide provider of community support, Respite and Individual Support for adults with disabilities.',
  phone: '(732) 801-7683',
  phoneHref: 'tel:+17328017683',
  email: 'info@mmdcommunitycare.com',
  address: { street: '2950 Hamilton Blvd', city: 'South Plainfield', state: 'NJ', zip: '07080' },
  walkIn: 'Tuesdays and Thursdays, 11am to 4pm',
  url: 'https://www.mmdcommunitycare.com',
  logo: '/brand/mmd-logo.png',
} as const;

// Onboarding checks every DSP clears before working a case — stated on the
// current site and compliance-relevant, so kept verbatim in substance.
export const serviceDetail = [
  {
    slug: 'individual-support',
    name: 'Individual Support',
    lead: 'One-to-one support for adults who need a consistent, trained person beside them.',
    body: [
      'Some clients need more intensive support than a family can provide alone. Our Direct Support Professionals work one-to-one, keeping clients safe, comfortable and genuinely supported through the day.',
      'Support is built around the person: their routine, their goals and the things they want to keep doing for themselves.',
    ],
    includes: ['Personal care and daily living', 'Skill building toward independence', 'Community access and activities', 'Medication reminders'],
  },
  {
    slug: 'respite-care',
    name: 'Respite Care',
    lead: 'Temporary relief for family caregivers, without a drop in the quality of care.',
    body: [
      'Being a primary caregiver is relentless. Respite gives you a genuine break while your family member stays with someone trained, checked and familiar with their needs.',
      'We work to an individualised plan agreed with you, so the routine holds while you are away.',
    ],
    includes: ['Short-term and scheduled relief', 'Individualised care plan', 'Trained, background-checked staff', 'Continuity of routine'],
  },
  {
    slug: 'community-support',
    name: 'Community Support',
    lead: 'Support to take part in the community, not just be present in it.',
    body: [
      'Community support is about participation — getting to appointments, activities and the places that matter, with the right level of help alongside.',
      'Our team is available around the clock so the support fits the life, rather than the other way round.',
    ],
    includes: ['Transportation to essential services', 'Social and recreational activities', 'Appointment coordination', 'Around-the-clock availability'],
  },
] as const;

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
