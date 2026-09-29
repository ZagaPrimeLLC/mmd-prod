import Link from 'next/link';
import { Users, Home, HeartHandshake, ArrowRight } from 'lucide-react';
import { services } from '@/lib/site';

const icons = [Users, Home, HeartHandshake];

export default function ValuesSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">Our Services</h2>
          <p className="text-xl text-gray-600">
            Person-centred support built around each client&apos;s needs, goals and preferences.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {services.map((s, i) => {
            const Icon = icons[i] ?? Users;
            return (
              <article
                key={s.slug}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:shadow-lg"
              >
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-navy">
                  <Icon className="h-7 w-7 text-gold" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-navy">{s.name}</h3>
                <p className="mb-5 leading-relaxed text-gray-600">{s.summary}</p>
                <Link href="/services" className="inline-flex items-center gap-1.5 font-semibold text-steel hover:text-navy">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
