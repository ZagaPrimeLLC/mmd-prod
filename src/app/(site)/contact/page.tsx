import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import ContactForm from '@/components/site/ContactForm';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Book a free consultation with MMD Community Care, or call (732) 801-7683. Serving adults with special needs across New Jersey.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Book a free consultation"
        lead="Tell us a little about the person you are looking for support for, and we will call you back."
        image="/images/hero-care.png"
        imageAlt="An MMD support worker talking with a client at home"
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:px-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm sourcePage="/contact" />
          </div>

          <aside className="lg:col-span-2">
            <div className="rounded-2xl bg-cream p-7">
              <h2 className="text-lg font-bold text-navy">Speak to someone now</h2>
              <ul className="mt-5 space-y-5 text-sm">
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                  <span>
                    <span className="block font-semibold text-gray-800">Phone</span>
                    <a href={site.phoneHref} className="text-navy underline">{site.phone}</a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                  <span>
                    <span className="block font-semibold text-gray-800">Email</span>
                    <a href={`mailto:${site.email}`} className="text-navy underline">{site.email}</a>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                  <span>
                    <span className="block font-semibold text-gray-800">Office</span>
                    {site.address.street}<br />
                    {site.address.city}, {site.address.state} {site.address.zip}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                  <span>
                    <span className="block font-semibold text-gray-800">Walk-in hours</span>
                    {site.walkIn}
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
