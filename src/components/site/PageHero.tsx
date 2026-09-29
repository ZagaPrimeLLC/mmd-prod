import Image from 'next/image';

export default function PageHero({
  eyebrow, title, lead, image, imageAlt,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0">
        <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover" />
        {/* faded so the photograph reads behind the type without fighting it */}
        <div className="absolute inset-0 bg-navy/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/75 to-navy/30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">{eyebrow}</p>
        )}
        <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-100 sm:text-lg md:text-xl">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
