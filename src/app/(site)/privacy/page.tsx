import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout, { Section, Confirm } from '@/components/site/LegalLayout';
import { site, legal } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How MMD Community Care handles information collected through this website, what we store, who processes it, and the choices you have.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Website Privacy Policy"
      intro="This policy covers the information this website collects. It is separate from our Notice of Privacy Practices, which covers health information we hold as a care provider."
      effective={legal.effective}
    >
      <Section heading="What this policy covers">
        <p>
          This policy applies to {site.legalName} and to this website only. It explains what we
          collect when you fill in a form, request an appointment, apply for a job, or use the chat
          assistant on this site.
        </p>
        <p>
          If you are a client or the family of a client, the health information we hold about care
          you receive is governed by a separate notice. Please read our{' '}
          <Link href="/notice-of-privacy-practices" className="font-semibold text-navy underline">
            Notice of Privacy Practices
          </Link>
          .
        </p>
      </Section>

      <Section heading="Please do not send health information through this website">
        <p>
          This website is not a secure channel for health information. Do not type a diagnosis,
          medication, treatment detail, insurance or Medicaid identification number, or any other
          health or medical detail into any form or into the chat assistant on this site.
        </p>
        <p>
          The chat assistant follows a fixed script. It cannot take health information, it is not a
          clinician, and it does not give medical advice. If you need to discuss care details, call
          us at{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>{' '}
          so we can talk with you directly.
        </p>
      </Section>

      <Section heading="What we collect">
        <p>We collect only what you choose to type or attach. In practice that is:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Contact and consultation requests.</strong> Your name, email address, phone
            number, the reason you are reaching out, and anything else you write in the message
            field.
          </li>
          <li>
            <strong>Appointment requests.</strong> The date and time you selected, plus the contact
            details above.
          </li>
          <li>
            <strong>Job applications.</strong> Your name, email address, phone number, the position
            you applied for, what you wrote about your experience, and a resume file if you attach
            one.
          </li>
          <li>
            <strong>Chat assistant.</strong> The path you took through the assistant and any contact
            details you chose to share so that we can follow up.
          </li>
        </ul>
        <p>
          We do not buy personal information about you from anyone, and we do not ask for a Social
          Security number, a date of birth, or a payment card number anywhere on this website.
        </p>
      </Section>

      <Section heading="Cookies and tracking">
        <p>
          The public pages of this website set no cookies. There is no advertising network, no
          social media pixel, no session recording, and no cross site tracking on this site. We do
          not respond differently to a Do Not Track signal because we do not track you in the first
          place.
        </p>
        <p>
          Cookies are used in one place only: the private staff dashboard at /dashboard, where a
          sign in cookie keeps an authorized MMD employee signed in. That cookie is never set for a
          member of the public browsing this site.
        </p>
        <p>
          Our hosting provider keeps standard server logs, which include the internet address of the
          request and the page requested. These are used to keep the site running and secure.
        </p>
      </Section>

      <Section heading="How we use what you send">
        <p>We use the information you submit to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Answer your question and return your call or email.</li>
          <li>Schedule and confirm a consultation or an office appointment.</li>
          <li>Review and progress a job application, including contacting you about the role.</li>
          <li>Keep a record of the request so that nothing is missed.</li>
          <li>Meet our obligations as a New Jersey approved provider.</li>
        </ul>
        <p>
          We do not sell personal information. We do not share it with advertisers. We do not use it
          for targeted advertising or for automated decision making that produces a legal or
          similarly significant effect.
        </p>
      </Section>

      <Section heading="Who else handles the information">
        <p>
          We use a small number of service providers to run this site. They process information on
          our instructions only:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Vercel</strong> hosts and serves this website.
          </li>
          <li>
            <strong>Supabase</strong> stores form submissions, appointment requests and job
            applications in a database hosted in the United States.
          </li>
        </ul>
        <p>
          We may also disclose information when the law requires it, when we must protect the safety
          of a person, or to our professional advisors where they are bound to keep it
          confidential.
        </p>
      </Section>

      <Section heading="How it is protected">
        <p>
          The site is served only over an encrypted connection. Submissions travel encrypted and are
          stored encrypted at rest. Access to the records is restricted to authorized MMD staff who
          sign in, and the database refuses to return records to anyone who is not signed in as an
          authorized member of our team. Resume files are held in private storage that is not
          reachable from the public internet.
        </p>
        <p>
          No method of transmission or storage is perfect, so we cannot promise absolute security,
          but we review these controls and correct what needs correcting.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          We keep an inquiry or appointment request for as long as we need it to respond and to keep
          an accurate record of our operations. We keep job applications and resumes for{' '}
          <Confirm>[MMD to confirm the retention period]</Confirm>, after which they are deleted,
          except where a longer period is required by employment or provider record keeping rules.
        </p>
      </Section>

      <Section heading="Your choices">
        <p>
          You can ask us what you have sent us, ask us to correct it, or ask us to delete it. Call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>{' '}
          or email{' '}
          <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">
            {site.email}
          </a>
          . We will confirm your identity before acting so that we do not hand your information to
          someone else.
        </p>
        <p>
          The New Jersey Data Privacy Act gives New Jersey residents rights over personal data held
          by businesses that meet the size thresholds in that law. We do not believe we meet those
          thresholds, and health information we hold as a care provider is governed by HIPAA rather
          than by that law. We will still honor a reasonable request of the kind described above.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This website is intended for adults. We do not knowingly collect information from children
          under 13 through this site. If you believe a child has sent us information here, contact
          us and we will delete it.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If we change this policy we will post the new version here and update the effective date
          at the top of the page.
        </p>
      </Section>
    </LegalLayout>
  );
}
