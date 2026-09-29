import Link from 'next/link';
import Image from 'next/image';
import { Heart, Award, Users, ArrowRight } from 'lucide-react';

const badges = [
  { icon: Heart, label: 'Compassionate Care' },
  { icon: Award, label: 'DDD Certified' },
  { icon: Users, label: 'Statewide Service' },
];

export default function HeroSection() {
  return (
    <section className="relative h-[600px] overflow-hidden md:h-[700px]">
      <div className="absolute inset-0">
        <Image
          src="/images/home-hero.jpg"
          alt="An MMD support worker talking with a client in his own living room"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/80 to-navy/20" />
      </div>

      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 py-20">
          <div className="max-w-3xl">
            <p className="mb-6 inline-block rounded-full border border-gold/30 bg-gold/20 px-4 py-2 font-semibold text-gold backdrop-blur-sm">
              NJ DDD Approved Provider
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-white [text-shadow:0_2px_14px_rgba(12,26,58,0.6)] md:text-6xl">
              Serving Adults With <span className="text-gold">Special Needs</span>
            </h1>

            <p className="mb-8 text-xl text-gray-50 [text-shadow:0_1px_10px_rgba(12,26,58,0.7)] md:text-2xl">
              Providing exceptional community support, respite care, and individual support to
              adults with disabilities across the State of New Jersey.
            </p>

            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contact#book"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-8 py-4 text-lg font-bold text-navy shadow-xl hover:bg-gold-dark"
              >
                Book a Consultation
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-navy"
              >
                Our Services
              </Link>
            </div>

            <ul className="flex flex-wrap items-center gap-6">
              {badges.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 text-white">
                  <Icon className="h-5 w-5 text-gold" />
                  <span className="font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
