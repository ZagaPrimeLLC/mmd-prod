import Link from 'next/link';

/** Four facts a family or support coordinator checks first, in plain words. */
const facts = [
  { title: 'NJ DDD approved', body: 'A statewide provider approved by the Division of Developmental Disabilities.' },
  { title: 'Screened and trained', body: 'Fingerprinted, background checked, Boggs Center trained, CPR and First Aid certified.' },
  { title: 'Built around the person', body: 'Support follows the person’s routine, goals and Individualized Service Plan.' },
];

export default function TrustBadges() {
  return (
    <section aria-label="Why families choose MMD" className="grid gap-3 px-3 pt-3 sm:grid-cols-2 lg:grid-cols-4">
      {facts.map(({ title, body }) => (
        <div key={title} className="rounded-[20px] bg-paper px-6 py-8">
          <p className="text-xl font-medium text-navy-deep">{title}</p>
          <p className="mt-2 text-[16px] leading-[1.55] text-navy-deep">{body}</p>
        </div>
      ))}
      <Link href="/contact#book" className="group rounded-[20px] bg-gold px-6 py-8 text-navy-deep transition hover:bg-gold-dark">
        <p className="text-xl font-medium group-hover:underline group-hover:underline-offset-4">Start with a conversation</p>
        <p className="mt-2 text-[16px] leading-[1.55]">Tell us what matters to your family. We will help you understand the next steps.</p>
      </Link>
    </section>
  );
}
