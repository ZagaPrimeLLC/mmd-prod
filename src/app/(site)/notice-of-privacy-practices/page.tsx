import type { Metadata } from 'next';
import LegalLayout, { Section, Confirm } from '@/components/site/LegalLayout';
import { site, legal } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Notice of Privacy Practices',
  description:
    'How MMD Community Care may use and disclose your health information, and the rights you have over that information under HIPAA.',
  alternates: { canonical: '/notice-of-privacy-practices' },
};

export default function NoticeOfPrivacyPracticesPage() {
  return (
    <LegalLayout
      title="Notice of Privacy Practices"
      intro="This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully."
      effective={legal.effective}
    >
      <Section heading="Our commitment">
        <p>
          {site.legalName} is required by law to protect the privacy of your health information, to
          give you this notice of our legal duties and privacy practices, and to follow the terms of
          the notice that is currently in effect. We take that seriously.
        </p>
        <p>
          Health information means information that identifies you and relates to your physical or
          mental health, the care you receive, or payment for that care. This notice tells you when
          we may share it, when we need your permission first, and what you can ask us to do.
        </p>
      </Section>

      <Section heading="How we may use and share your health information without your permission">
        <p>
          <strong>For treatment.</strong> We share information with the people who provide your
          care. For example, a support coordinator or a direct support professional assigned to you
          may be told what support you need so that they can deliver it safely, and we may share
          information with your doctor or another provider involved in your care.
        </p>
        <p>
          <strong>For payment.</strong> We use and share information to bill and receive payment
          from New Jersey Medicaid, the Division of Developmental Disabilities, or another payer,
          and to confirm that services you received are covered.
        </p>
        <p>
          <strong>For health care operations.</strong> We use information to run the agency well.
          Examples include reviewing the quality of the support we deliver, training and supervising
          staff, and carrying out required audits and compliance reviews.
        </p>
        <p>
          The law also permits or requires us to share health information in specific situations.
          Those include: when a law requires it; for public health activities; to report suspected
          abuse, neglect or exploitation; for health oversight activities such as state
          investigations and licensing reviews; in response to a court order, subpoena or other
          lawful process; for certain law enforcement purposes; to a coroner, medical examiner or
          funeral director; for organ and tissue donation; for approved research in limited
          circumstances; to prevent a serious and imminent threat to health or safety; for workers
          compensation claims; and for specialized government functions such as military and
          national security activities.
        </p>
        <p>
          Unless you object, we may share relevant information with a family member, friend or other
          person you involve in your care or in payment for your care, and in a disaster relief
          situation.
        </p>
      </Section>

      <Section heading="When we need your written permission">
        <p>
          Other uses and disclosures are made only with your written authorization. Your written
          authorization is always required before we:
        </p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use or share psychotherapy notes, apart from the limited exceptions the law allows.</li>
          <li>Use or share your information for marketing purposes.</li>
          <li>Sell your health information.</li>
        </ul>
        <p>
          You may cancel an authorization in writing at any time. Canceling it stops any future use
          or sharing under that authorization. It cannot undo something we already did while the
          authorization was in effect.
        </p>
      </Section>

      <Section heading="Your rights over your health information">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>See and get a copy</strong> of the health information we hold about you,
            including an electronic copy if we keep it electronically. We will respond within the
            time the law allows and may charge a reasonable cost based fee for copies.
          </li>
          <li>
            <strong>Ask us to correct</strong> information you believe is wrong or incomplete. If we
            decline, we will tell you why in writing and you may file a statement of disagreement.
          </li>
          <li>
            <strong>Get a list of certain disclosures</strong> we made of your information in the
            six years before your request, apart from the disclosures the law excludes, such as
            those for treatment, payment and operations.
          </li>
          <li>
            <strong>Ask us to limit</strong> what we use or share. We are not required to agree,
            except in one case: if you pay in full out of pocket for a service, you may tell us not
            to share information about that service with your health plan, and we must honor that.
          </li>
          <li>
            <strong>Ask us to contact you a certain way</strong>, for example at a different address
            or phone number. We will accommodate reasonable requests.
          </li>
          <li>
            <strong>Get a paper copy</strong> of this notice at any time, even if you agreed to
            receive it electronically.
          </li>
          <li>
            <strong>Be told if there is a breach</strong> that compromises the privacy or security
            of your health information.
          </li>
          <li>
            <strong>Choose someone to act for you.</strong> If you have a guardian or you have given
            someone medical power of attorney, that person can exercise these rights for you. We
            will confirm their authority first.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact our {legal.privacyOfficer.title},{' '}
          <Confirm>{legal.privacyOfficer.name}</Confirm>, at{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>{' '}
          or{' '}
          <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">
            {site.email}
          </a>
          .
        </p>
      </Section>

      <Section heading="Our duties">
        <p>
          We are required by law to keep your health information private and secure, to give you
          this notice, to follow the terms of the notice currently in effect, and to notify you if a
          breach compromises your information.
        </p>
        <p>
          We may change this notice. A change applies to information we already hold as well as to
          information we receive afterwards. If we change it, we will post the new notice on this
          page with a new effective date and make paper copies available at our office.
        </p>
      </Section>

      <Section heading="How to complain">
        <p>
          If you believe your privacy rights have been violated, tell us. Contact our{' '}
          {legal.privacyOfficer.title} at{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          , or write to {site.address.street}, {site.address.city}, {site.address.state}{' '}
          {site.address.zip}.
        </p>
        <p>
          You may also file a complaint with the Secretary of the U.S. Department of Health and
          Human Services, Office for Civil Rights, 200 Independence Avenue SW, Washington, DC 20201,
          by calling 1-800-368-1019 (TDD 1-800-537-7697), or online at{' '}
          <a
            href="https://www.hhs.gov/ocr/complaints"
            className="font-semibold text-navy underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            hhs.gov/ocr/complaints
          </a>
          .
        </p>
        <p>
          <strong>You will not be penalized for filing a complaint.</strong> We will not retaliate
          against you, and filing a complaint will never affect the care you receive from us.
        </p>
      </Section>

      <Section heading="Other formats">
        <p>
          We will provide this notice in large print or another format you can use, and we will
          explain it to you in your language, free of charge. Ask any member of our staff or call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
