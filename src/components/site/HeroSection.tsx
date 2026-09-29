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
    <section className="relative flex min-h-[32rem] items-center overflow-hidden sm:min-h-[38rem] md:min-h-[44rem] lg:h-[48vw] lg:max-h-[54rem] lg:min-h-[44rem]">
      <div className="absolute inset-0">
        <Image
          src="/images/home-hero.jpg"
          alt="An MMD support worker talking with a client in his own living room"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/88 via-navy/55 to-navy/15" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="max-w-3xl">
          <p className="mb-5 inline-block rounded-full border border-gold/30 bg-gold/20 px-3.5 py-1.5 text-sm font-semibold text-gold backdrop-blur-sm sm:mb-6 sm:px-4 sm:py-2 sm:text-base">
            NJ DDD Approved Provider
          </p>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-white [text-shadow:0_2px_14px_rgba(12,26,58,0.6)] sm:mb-6 sm:text-4xl md:text-6xl">
            Serving Adults With <span className="text-gold">Special Needs</span>
          </h1>

          <p className="mb-7 text-lg text-gray-50 [text-shadow:0_1px_10px_rgba(12,26,58,0.7)] sm:mb-8 sm:text-xl md:text-2xl">
            Providing exceptional community support, respite care, and individual support to adults
            with disabilities across the State of New Jersey.
          </p>

          <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:gap-4">
            <Link
              href="/contact#book"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-base font-bold text-navy shadow-xl hover:bg-gold-dark sm:px-8 sm:py-4 sm:text-lg"
            >
              Book a Consultation
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-6 py-3.5 text-base font-semibold text-white hover:bg-white hover:text-navy sm:px-8 sm:py-4 sm:text-lg"
            >
              Our Services
            </Link>
          </div>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:gap-6">
            {badges.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-white">
                <Icon className="h-5 w-5 shrink-0 text-gold" />
                <span className="text-sm font-medium sm:text-base">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
