// A guided assistant, not a language model. Every answer below is drawn from
// what MMD actually states on the site, so it cannot invent a service, a price
// or an eligibility rule. Anything it cannot answer goes to a human.
export type ChatOption = { id: string; label: string; next: string };

export type ChatNode = {
  id: string;
  say: string[];
  options?: ChatOption[];
  capture?: 'lead';
  link?: { href: string; label: string };
};

export const CHAT: Record<string, ChatNode> = {
  start: {
    id: 'start',
    say: [
      'Hello, and thanks for visiting MMD Community Care.',
      'I can answer questions about our services, book you a consultation, or take your details so someone calls you back.',
      'Please keep any medical or personal health details out of this chat. We will go through anything clinical on the phone.',
      'What brings you here?',
    ],
    options: [
      { id: 'book', label: 'Book a free consultation', next: 'booking' },
      { id: 'family', label: 'I need care for a family member', next: 'family' },
      { id: 'job', label: 'I want to work as a caregiver', next: 'job' },
      { id: 'coordinator', label: "I'm a support coordinator", next: 'coordinator' },
      { id: 'other', label: 'Something else', next: 'human' },
    ],
  },
  booking: {
    id: 'booking',
    say: [
      'Consultations run on Tuesdays and Thursdays between 11am and 4pm, and take about 45 minutes.',
      'I will open the booking page so you can pick a time that suits you.',
    ],
    options: [{ id: 'go', label: 'Show me the times', next: 'book-link' }],
  },
  'book-link': {
    id: 'book-link',
    say: ['Choose a slot on the booking page and the office will call to confirm it.'],
    link: { href: '/contact#book', label: 'Open the booking page' },
  },
  family: {
    id: 'family',
    say: [
      'We support adults with developmental disabilities across New Jersey, and we are a DDD approved statewide provider.',
      'Which of these sounds closest?',
    ],
    options: [
      { id: 'individual', label: 'One-to-one daily support', next: 'individual' },
      { id: 'respite', label: 'A break for me as the caregiver', next: 'respite' },
      { id: 'community', label: 'Help getting out into the community', next: 'community' },
      { id: 'unsure', label: "I'm not sure yet", next: 'human' },
    ],
  },
  individual: {
    id: 'individual',
    say: [
      'That is our Individual Support service. A trained Direct Support Professional works one-to-one, helping with daily living, building skills and keeping the routine steady.',
      'Shall I take your details so someone can call you and talk it through?',
    ],
    options: [
      { id: 'book', label: 'Book a consultation', next: 'booking' },
      { id: 'yes', label: 'Just have someone call me', next: 'lead' },
      { id: 'more', label: 'Tell me about the staff first', next: 'vetting' },
    ],
  },
  respite: {
    id: 'respite',
    say: [
      'Respite Care gives primary caregivers a genuine break, with an individualised plan so your family member keeps their routine while you are away.',
      'Would you like someone to call you about it?',
    ],
    options: [
      { id: 'book', label: 'Book a consultation', next: 'booking' },
      { id: 'yes', label: 'Just have someone call me', next: 'lead' },
      { id: 'more', label: 'How are your staff vetted?', next: 'vetting' },
    ],
  },
  community: {
    id: 'community',
    say: [
      'Community Support helps people take part in activities, appointments and the places that matter, with the right level of help alongside. Our team is available around the clock.',
      'Would you like someone to call you?',
    ],
    options: [
      { id: 'book', label: 'Book a consultation', next: 'booking' },
      { id: 'yes', label: 'Just have someone call me', next: 'lead' },
      { id: 'more', label: 'How are your staff vetted?', next: 'vetting' },
    ],
  },
  vetting: {
    id: 'vetting',
    say: [
      'Every Direct Support Professional clears federal and New Jersey State screening, fingerprinting, drug screening, an interview, Central Registry verification, and holds CPR and First Aid certification. They also complete online training with the Rutgers Boggs Center and ongoing training on NJ DDD changes.',
      'Would you like someone to call you?',
    ],
    options: [
      { id: 'yes', label: 'Yes, please call me', next: 'lead' },
      { id: 'no', label: 'Not right now', next: 'end' },
    ],
  },
  job: {
    id: 'job',
    say: [
      'We hire Direct Support Professionals across New Jersey, with flexible schedules.',
      'You can apply on the Careers page, or come to the office on Tuesdays and Thursdays, 11am to 4pm, at 2950 Hamilton Blvd, South Plainfield.',
      'Shall I take your details so the hiring team can call you?',
    ],
    options: [
      { id: 'yes', label: 'Yes, have them call me', next: 'lead' },
      { id: 'no', label: "I'll use the Careers page", next: 'end' },
    ],
  },
  coordinator: {
    id: 'coordinator',
    say: [
      'Thanks for considering us. We take referrals statewide for Individual Support, Respite and Community Support.',
      'Leave your details and the office will get back to you about availability for your individual.',
    ],
    options: [{ id: 'yes', label: 'Take my details', next: 'lead' }],
  },
  human: {
    id: 'human',
    say: [
      'That one is better answered by a person.',
      'Leave your name and a number and someone from the office will call you back, usually within one business day.',
    ],
    options: [{ id: 'yes', label: 'Take my details', next: 'lead' }],
  },
  lead: { id: 'lead', say: [], capture: 'lead' },
  end: {
    id: 'end',
    say: [
      'No problem. If you change your mind, you can call the office on (732) 801-7683 any time.',
    ],
  },
};
