import type { Metadata } from 'next';
import LegalLayout, { Section } from '@/components/site/LegalLayout';
import { site, legal } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'Our commitment to an accessible website, the standard we build to, and how to tell us about a barrier so we can fix it.',
  alternates: { canonical: '/accessibility' },
};

export default function AccessibilityPage() {
  return (
    <LegalLayout
      title="Accessibility Statement"
      intro="We support adults with disabilities every day. A website that shuts people out would contradict the work, so we build this one to be usable by everyone."
      effective={legal.effective}
    >
      <Section heading="The standard we build to">
        <p>
          We aim to meet the Web Content Accessibility Guidelines version 2.1 at Level AA. That is
          the standard the U.S. Department of Health and Human Services has set for the websites of
          health programs that receive federal financial assistance, and it is the benchmark used
          under the Americans with Disabilities Act.
        </p>
        <p>
          We treat it as the standard for this site now rather than waiting for a deadline, because
          the people we serve need the site to work today.
        </p>
      </Section>

      <Section heading="What we have done">
        <ul className="list-disc space-y-2 pl-6">
          <li>Every page can be operated with a keyboard alone, with a visible focus outline.</li>
          <li>
            Headings run in a logical order so that a screen reader can move through a page
            structurally.
          </li>
          <li>Every meaningful image carries a text description.</li>
          <li>
            Every form field has a label that is read out, and an error is described in words rather
            than by color alone.
          </li>
          <li>
            Text is sized in relative units so that it reflows when you enlarge it, and the site
            works at 200 percent zoom and at small phone widths without sideways scrolling.
          </li>
          <li>
            Text and background colors are chosen for contrast, and information is never carried by
            color alone.
          </li>
          <li>
            Animation on the site, including the pulsing chat button, switches off automatically for
            anyone whose device asks for reduced motion.
          </li>
          <li>
            A skip link lets a keyboard or screen reader user jump straight to the main content.
          </li>
        </ul>
      </Section>

      <Section heading="Where we know we fall short">
        <p>
          Accessibility is never finished. We review this site regularly and we fix what we find. If
          we become aware of a barrier we cannot fix quickly, we will say so here and offer another
          way to get the same information or service.
        </p>
      </Section>

      <Section heading="Another way to reach us, always">
        <p>
          If any part of this website gets in your way, you never have to use it to reach us. Call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>{' '}
          and a person will help you with anything the site does, including booking a consultation
          and applying for a job. You can also visit us at {site.address.street},{' '}
          {site.address.city}, {site.address.state} {site.address.zip}.
        </p>
        <p>
          We provide free aids and services for effective communication, including qualified sign
          language interpreters and information in large print, accessible electronic formats and
          other formats on request.
        </p>
      </Section>

      <Section heading="Tell us about a barrier">
        <p>
          If you hit something on this site that does not work for you, we want to know so that we
          can fix it. Email{' '}
          <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">
            {site.email}
          </a>{' '}
          or call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          . Tell us the page and what happened, and we will respond and tell you what we are doing
          about it.
        </p>
      </Section>
    </LegalLayout>
  );
}
