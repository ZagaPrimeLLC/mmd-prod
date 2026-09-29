import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';
import { site } from '@/lib/site';

export default function SiteFooter() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:px-12 py-14 md:grid-cols-3">
        <div>
          <Image
            src={site.logo}
            alt={`${site.legalName} logo`}
            width={616}
            height={484}
            className="mb-4 h-16 w-auto"
          />
          <p className="text-lg font-bold">{site.legalName}</p>
          <p className="text-sm font-medium text-gold">{site.slogan}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-200">
            A New Jersey DDD approved statewide provider of community support, respite and
            individual support for adults with disabilities.
          </p>
        </div>

        <div>
          <p className="font-semibold text-gold">Contact</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-200">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>{site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-gold" />
              <a href={site.phoneHref} className="hover:text-white">{site.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gold" />
              <a href={`mailto:${site.email}`} className="hover:text-white">{site.email}</a>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-gold">Quick links</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-200">
            <li><Link href="/services" className="hover:text-white">Our services</Link></li>
            <li><Link href="/mission" className="hover:text-white">Mission and vision</Link></li>
            <li><Link href="/contact/testimonials" className="hover:text-white">Testimonials</Link></li>
            <li><Link href="/about" className="hover:text-white">About us</Link></li>
            <li><Link href="/careers" className="hover:text-white">Caregiver jobs</Link></li>
            <li><Link href="/contact" className="hover:text-white">Book a consultation</Link></li>
          </ul>
          <p className="mt-6 text-sm text-gray-300">
            Walk-in paperwork: {site.walkIn}
          </p>
        </div>
      </div>

      <div className="border-t border-white/15">
        <p className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12 py-5 text-sm text-gray-300">
          &copy; {new Date().getFullYear()} {site.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
