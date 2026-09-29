import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout, { Section } from '@/components/site/LegalLayout';
import { site, legal } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms that apply when you use the MMD Community Care website, including what the site is and is not, and how appointment requests work.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Use"
      intro="These terms apply to this website. They do not change any service agreement you have with us as a client."
      effective={legal.effective}
    >
      <Section heading="Who we are">
        <p>
          This website is operated by {site.legalName}, {site.address.street}, {site.address.city},{' '}
          {site.address.state} {site.address.zip}. By using the site you agree to these terms. If
          you do not agree with them, please do not use the site.
        </p>
      </Section>

      <Section heading="This site is information, not medical advice">
        <p>
          Everything on this site is general information about the support we provide. It is not
          medical, clinical, legal or financial advice, and reading it does not create a provider
          relationship between us. Never delay seeking advice from a qualified professional because
          of something you read here.
        </p>
        <p>
          <strong>If this is an emergency, call 911.</strong> Do not use this website, the contact
          form or the chat assistant to report an emergency or an urgent change in someone&apos;s
          condition. Those are not monitored around the clock.
        </p>
      </Section>

      <Section heading="The chat assistant">
        <p>
          The assistant on this site follows a fixed script written by us. It is not a clinician and
          it does not give advice about care. It cannot accept health information, and you should
          not type any into it. Anything you send through it reaches our team the same way a contact
          form does, and a person replies.
        </p>
      </Section>

      <Section heading="Appointment requests">
        <p>
          Choosing a time on this site sends us a request. It is not a confirmed appointment until a
          member of our team contacts you and confirms it. If you have not heard from us, call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          .
        </p>
      </Section>

      <Section heading="Job applications">
        <p>
          Applying through this site does not create an offer of employment or a contract. Every
          position is subject to the checks New Jersey requires of a provider, which are described
          on our{' '}
          <Link href="/careers" className="font-semibold text-navy underline">
            careers page
          </Link>
          .
        </p>
      </Section>

      <Section heading="Using the site properly">
        <p>Please do not:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Submit anything false, or impersonate another person.</li>
          <li>Submit anything unlawful, abusive or infringing.</li>
          <li>
            Try to gain access to any part of the site or database you are not authorized to reach,
            or interfere with how the site runs.
          </li>
          <li>
            Use an automated tool to scrape the site or to flood our forms with submissions.
          </li>
        </ul>
        <p>
          We may remove content and restrict access where these terms are broken, and we may report
          unlawful activity.
        </p>
      </Section>

      <Section heading="Our content">
        <p>
          The text, photographs, logo and design on this site belong to {site.legalName} or are used
          with permission. Please do not copy or reuse them without our written agreement. The MMD
          name and shield are ours. You are welcome to link to the site.
        </p>
      </Section>

      <Section heading="Other sites we link to">
        <p>
          Where we link to another organization, we do so because the information may help you. We
          do not control those sites and we are not responsible for their content or their privacy
          practices.
        </p>
      </Section>

      <Section heading="Availability and accuracy">
        <p>
          We work to keep this site accurate and available, but we cannot promise it will always be
          either. Service descriptions, availability and hours can change. Call us to confirm
          anything you are relying on.
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of the State of New Jersey, and any dispute about
          them belongs in the state or federal courts located in New Jersey.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          We may update these terms. The version on this page, with the effective date at the top,
          is the one that applies.
        </p>
      </Section>
    </LegalLayout>
  );
}
