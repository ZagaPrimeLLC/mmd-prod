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
    <section className="relative flex items-center overflow-hidden py-16 sm:py-20 md:py-28 lg:min-h-[30vw] lg:max-h-[34rem]">
      <div className="absolute inset-0">
        <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover object-[60%_center]" />
        {/* faded so the photograph reads behind the type without fighting it */}
        <div className="absolute inset-0 bg-navy/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/10" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">{eyebrow}</p>
        )}
        <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white [text-shadow:0_2px_12px_rgba(12,26,58,0.65)] sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-50 [text-shadow:0_1px_8px_rgba(12,26,58,0.7)] sm:text-lg md:text-xl">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
