import Link from 'next/link';
import { site } from '@/lib/site';

/**
 * Shown on every public form. It tells people what not to send us here and
 * where to read what we do with what they do send.
 */
export default function FormPrivacyNote() {
  return (
    <p className="rounded-lg border border-gray-200 bg-cream p-3 text-xs leading-relaxed text-gray-600">
      Please do not include medical details, a diagnosis, medication or a Medicaid identification
      number in this form. For anything clinical, call{' '}
      <a href={site.phoneHref} className="font-semibold text-navy underline">
        {site.phone}
      </a>
      . We use what you send only to respond to you. Read our{' '}
      <Link href="/privacy" className="font-semibold text-navy underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}
