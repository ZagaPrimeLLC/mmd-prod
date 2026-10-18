import type { Metadata } from 'next';
import { PHOTOS } from '@/lib/photos';
import PageHero from '@/components/site/PageHero';
import ContactForm from '@/components/site/ContactForm';
import BookingFlow from '@/components/site/BookingFlow';
import WalkInStatus from '@/components/site/WalkInStatus';
import { site } from '@/lib/site';
import { getSchedule } from '@/lib/cms/read';
import { officeHoursLabel } from '@/lib/booking';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Book a free consultation with MMD Community Care, call (732) 801-7683, or visit our office at 2950 Hamilton Blvd, South Plainfield, NJ. Serving adults across New Jersey.',
  alternates: { canonical: '/contact' },
};

const BUTTON = 'inline-flex items-center justify-center rounded-full px-6 py-3 text-[16px] font-medium transition hover:-translate-y-0.5 active:translate-y-0';

export default async function ContactPage() {
  const schedule = await getSchedule();
  const hours = officeHoursLabel(schedule);
  return (
    <>
      <PageHero
        crumbs={[{ name: 'Contact', href: '/contact' }]}
        title="Book a free consultation"
        lead="Tell us a little about the person you are looking for support for, and we will call you back."
        photo={PHOTOS.office}
      />

      <section className="grid gap-3 px-3 pt-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div id="book" className="scroll-mt-24 rounded-[20px] bg-paper px-6 py-12 sm:px-12">
            <h2 className="text-[2.4rem] text-navy-deep md:text-[3rem]">Pick a time</h2>
            <p className="mt-3 text-[17px] text-navy-deep">Choose a slot and we will call you to confirm it.</p>
            <div className="mt-8">
              <BookingFlow schedule={schedule} />
            </div>
          </div>
          <div id="send-a-message" className="scroll-mt-24 rounded-[20px] bg-paper px-6 py-12 sm:px-12">
            <h2 className="text-[2.4rem] text-navy-deep md:text-[3rem]">Or send a message</h2>
            <p className="mt-3 text-[17px] text-navy-deep">Prefer to write? Tell us what you need and we will get back to you.</p>
            <div className="mt-8">
              <ContactForm sourcePage="/contact" />
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-[20px] bg-navy-deep px-6 py-12 text-paper sm:px-10 lg:sticky lg:top-[84px]">
          <h2 className="text-[2.2rem]">Speak to someone now</h2>
          <dl className="mt-8 space-y-6 text-[17px]">
            <div>
              <dt className="text-paper/70">Phone</dt>
              <dd className="mt-1 text-xl"><a href={site.phoneHref} className="underline decoration-gold decoration-2 underline-offset-4">{site.phone}</a></dd>
            </div>
            <div>
              <dt className="text-paper/70">Email</dt>
              <dd className="mt-1 break-words text-xl"><a href={`mailto:${site.email}`} className="underline decoration-gold decoration-2 underline-offset-4">{site.email}</a></dd>
            </div>
            <div>
              <dt className="text-paper/70">Office</dt>
              <dd className="mt-1 text-xl">
                <a href="#visit" className="underline decoration-gold decoration-2 underline-offset-4">
                  {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-paper/70">Walk-in hours</dt>
              <dd className="mt-1 text-xl">{hours}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section id="visit" className="scroll-mt-20 px-3 py-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="flex flex-col justify-between rounded-[20px] bg-gold px-6 py-12 text-navy-deep sm:px-12">
            <div>
              <h2 className="text-[2.4rem] md:text-[3rem]">Visit the office</h2>
              <address className="mt-6 text-xl not-italic leading-snug">
                {site.legalName}
                <br />
                {site.address.street}
                <br />
                {site.address.city}, {site.address.state} {site.address.zip}
              </address>
              <p className="mt-6 text-[17px] leading-[1.6]">
                {schedule.unavailable
                  ? `To visit, ${hours}. Bring your paperwork, or just come and meet the team.`
                  : `Walk in on ${hours}, no appointment needed. Bring your paperwork, or just come and meet the team.`}
              </p>
              <p className="mt-6 rounded-[20px] bg-paper px-5 py-4 text-[17px] font-medium">
                <WalkInStatus schedule={schedule} />
              </p>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <a href={site.directionsUrl} target="_blank" rel="noopener noreferrer" className={`${BUTTON} bg-navy-deep text-paper hover:bg-navy`}>
                Get directions
              </a>
              <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className={`${BUTTON} bg-paper text-navy-deep hover:bg-white`}>
                Open in Google Maps
              </a>
            </div>
          </div>
          <div className="relative min-h-[26rem] overflow-hidden rounded-[20px] bg-cream lg:min-h-[36rem]">
            <iframe
              title={`Map showing ${site.legalName}, ${site.address.street}, ${site.address.city}, ${site.address.state}`}
              src={site.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
      </section>
    </>
  );
}
