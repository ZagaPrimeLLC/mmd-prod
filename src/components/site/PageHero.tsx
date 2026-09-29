export default function PageHero({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <section className="bg-gradient-to-br from-navy to-navy-dark py-16 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        {eyebrow && <p className="mb-3 font-semibold uppercase tracking-wider text-gold">{eyebrow}</p>}
        <h1 className="text-3xl font-bold md:text-5xl">{title}</h1>
        {lead && <p className="mt-5 max-w-3xl text-lg text-gray-100 md:text-xl">{lead}</p>}
      </div>
    </section>
  );
}
