import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import Reveal from '@/components/site/Reveal';
import type { Photo } from '@/lib/photos';
import { getSlotSafe } from '@/lib/cms/read';
import { HOME_CARE_HREF, HOME_CARE_CONTACT } from '@/lib/services';

export default async function HomeCareFeature({ photo }: { photo: Photo }) {
  const [headline, introduction] = await Promise.all([getSlotSafe('homecare.feature.headline'), getSlotSafe('homecare.feature.description')]);
  return <section data-track-slot="home-care.feature" className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-cream text-navy-deep">
    <div className="grid lg:grid-cols-[1.1fr_1fr]">
      <div className="relative aspect-[4/3] sm:aspect-[3/2] lg:order-2 lg:aspect-auto lg:min-h-[30rem]">
        <Image src={photo.src} alt={photo.alt} quality={82} fill sizes="(min-width:1024px) 48vw, 100vw" className="object-cover object-top" />
        <span className="absolute bottom-6 left-6 rounded-full bg-paper px-4 py-2 text-sm font-medium sm:left-12">Home Care Services</span>
      </div>
      <Reveal className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:order-1 lg:py-20">
        <p className="text-sm font-medium uppercase tracking-[.16em]">Support in familiar surroundings</p>
        <h2 className="mt-5 max-w-[15ch] text-[2.6rem] leading-[1.08] md:text-[3.6rem]">{headline.text}</h2>
        <p className="mt-6 max-w-[45ch] text-lg leading-relaxed">{introduction.text}</p>
        <p className="mt-6 text-sm font-medium">Licensed, bonded and insured.</p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link href={HOME_CARE_HREF} data-cta="explore-home-care" data-placement="home-care-feature" className="inline-flex items-center gap-3 rounded-full bg-navy-deep px-6 py-3.5 text-paper transition hover:-translate-y-0.5 hover:bg-navy">Explore home care <ArrowUpRight aria-hidden className="h-5 w-5" /></Link>
          <Link href={`${HOME_CARE_CONTACT}#send-a-message`} data-cta="home-care-enquiry" data-placement="home-care-feature" className="font-medium underline decoration-gold decoration-2 underline-offset-4">Talk to our team</Link>
        </div>
      </Reveal>
    </div>
  </section>;
}
