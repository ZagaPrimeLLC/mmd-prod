import Link from 'next/link';
import Image from 'next/image';

export default function CareersBand() {
  return (
    <section className="bg-gradient-to-br from-navy to-navy-dark py-20 text-white">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Image
            src="/images/garden.jpg"
            alt="An MMD support worker and a client having tea in the garden"
            width={800}
            height={600}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="rounded-2xl shadow-2xl"
          />
          <div>
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">Better Care Starts With You!</h2>
            <p className="mb-8 text-xl text-gray-100">
              Join our team of dedicated professionals and make a real difference in the lives of
              adults with special needs. We&apos;re always looking for compassionate caregivers.
            </p>
            <Link
              href="/careers"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-8 py-4 text-lg font-bold text-navy hover:bg-gold-dark"
            >
              Explore Caregiver Jobs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
