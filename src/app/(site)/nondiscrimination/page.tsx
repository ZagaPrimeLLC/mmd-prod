import type { Metadata } from 'next';
import LegalLayout, { Section, Confirm } from '@/components/site/LegalLayout';
import { site, legal } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Nondiscrimination and Language Assistance',
  description:
    'MMD Community Care complies with applicable federal and New Jersey civil rights laws. Free language assistance and auxiliary aids are available.',
  alternates: { canonical: '/nondiscrimination' },
};

export default function NondiscriminationPage() {
  return (
    <LegalLayout
      title="Nondiscrimination and Language Assistance"
      intro="We serve every person who comes to us on equal terms, and we provide free help with language and communication."
      effective={legal.effective}
    >
      <Section heading="Notice of nondiscrimination">
        <p>
          {site.legalName} complies with applicable federal civil rights laws and with the New
          Jersey Law Against Discrimination. We do not exclude people, deny them services, or treat
          them differently because of race, color, national origin, age, disability or sex.
        </p>
        <p>We do not:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Refuse to provide services on any of those grounds.</li>
          <li>Provide a lesser standard of support on any of those grounds.</li>
          <li>
            Treat anyone differently from anyone else in the same situation on any of those grounds.
          </li>
        </ul>
      </Section>

      <Section heading="Help with communication, free of charge">
        <p>
          <strong>
            If you speak a language other than English, language assistance services are available
            to you free of charge.
          </strong>{' '}
          Call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          .
        </p>
        <p>
          We also provide free aids and services to people with disabilities so that they can
          communicate with us effectively. That includes qualified sign language interpreters, and
          written information in other formats such as large print, accessible electronic formats
          and other formats on request.
        </p>
        <p>
          If you need any of this, ask any member of our staff or call{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          . You will never be charged for it, and you will never be asked to bring your own
          interpreter.
        </p>
      </Section>

      <Section heading="Notice of availability of language assistance">
        <p className="text-sm text-gray-600">
          <Confirm>
            MMD to confirm this list against the current HHS Office for Civil Rights table of the 15
            languages most commonly spoken by people with limited English proficiency in New Jersey,
            and to replace each line with the official translated tagline OCR publishes for that
            language.
          </Confirm>
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {legal.languages.map((lang) => (
            <li
              key={lang}
              className="rounded-lg border border-gray-200 bg-cream px-4 py-3 text-sm text-gray-700"
            >
              <span className="font-semibold text-navy">{lang}</span>
              <span className="mt-1 block">
                Language assistance services are available free of charge. Call {site.phone}.
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="How to raise a concern">
        <p>
          If you believe we failed to provide these services, or discriminated in any of the ways
          described above, you can file a grievance with our {legal.civilRightsCoordinator.title},{' '}
          <Confirm>{legal.civilRightsCoordinator.name}</Confirm>, at {site.address.street},{' '}
          {site.address.city}, {site.address.state} {site.address.zip}, by phone at{' '}
          <a href={site.phoneHref} className="font-semibold text-navy underline">
            {site.phone}
          </a>
          , or by email at{' '}
          <a href={`mailto:${site.email}`} className="font-semibold text-navy underline">
            {site.email}
          </a>
          .
        </p>
        <p>
          You can file in person, by mail, by phone or by email. If you need help filing, our
          coordinator will help you.
        </p>
        <p>
          You may also file a civil rights complaint with the U.S. Department of Health and Human
          Services, Office for Civil Rights, online at{' '}
          <a
            href="https://ocrportal.hhs.gov/ocr/portal/lobby.jsf"
            className="font-semibold text-navy underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            ocrportal.hhs.gov
          </a>
          , by mail to 200 Independence Avenue SW, Room 509F, HHH Building, Washington, DC 20201, or
          by phone at 1-800-368-1019 (TDD 1-800-537-7697).
        </p>
        <p>
          In New Jersey you may also contact the New Jersey Division on Civil Rights. Filing a
          complaint will never affect the care you receive from us.
        </p>
      </Section>
    </LegalLayout>
  );
}
