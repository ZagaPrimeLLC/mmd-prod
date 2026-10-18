import { Plus } from 'lucide-react';
import JsonLd from '@/components/site/JsonLd';
import type { Faq } from '@/lib/seo-content';

/**
 * Questions people actually ask, as native disclosure widgets (keyboard and
 * screen reader friendly with no script), plus FAQPage structured data.
 */
export default function Faqs({ faqs, title = 'Common questions' }: { faqs: Faq[]; title?: string }) {
  return (
    <div>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
        }}
      />
      <h2 className="text-[2.6rem] text-navy-deep md:text-5xl">{title}</h2>
      <div className="mt-10 space-y-2">
        {faqs.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 text-left text-xl font-normal text-navy-deep marker:hidden [&::-webkit-details-marker]:hidden">
              {f.q}
              <Plus aria-hidden className="mt-1 h-5 w-5 shrink-0 text-navy-deep transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <p className="max-w-[60ch] pb-6 text-[17px] leading-[1.6] text-navy-deep">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
