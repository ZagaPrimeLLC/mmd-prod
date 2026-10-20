import type { Metadata } from 'next';
import { PHOTOS } from '@/lib/photos';
import Link from 'next/link';
import PageHero from '@/components/site/PageHero';
import StepsSection from '@/components/site/StepsSection';
import Faqs from '@/components/site/Faqs';
import JsonLd from '@/components/site/JsonLd';
import CTABanner from '@/components/site/CTABanner';
import { GETTING_STARTED, GETTING_STARTED_FAQS, DDD_SERVICES } from '@/lib/seo-content';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How to Start NJ DDD Services: A Family Guide',
  description:
    'A plain-language guide to starting NJ Division of Developmental Disabilities services for an adult: eligibility, support coordinators, the NJ CAT assessment, service plans and choosing a provider.',
  alternates: { canonical: '/getting-started' },
};

export default async function GettingStartedPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: 'How to start NJ DDD services for an adult',
          description: metadata.description,
          step: GETTING_STARTED.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.body })),
        }}
      />
      <PageHero
        crumbs={[{ name: 'Getting started', href: '/getting-started' }]}
        title="Starting DDD services for an adult in New Jersey"
        lead="The Division of Developmental Disabilities process can feel like a maze the first time. Here is the path in plain words, and where MMD fits in."
        photo={PHOTOS['getting-started-plan']}
      />

      <aside className="mx-3 mt-3 rounded-[20px] bg-cream px-6 py-8 text-navy-deep sm:px-12">
        <p className="text-lg">For Home Health Aide Services, you can contact our team directly. <Link href="/services/home-health-aide#getting-started" className="font-medium underline decoration-gold decoration-2 underline-offset-4">See how to start home care</Link>.</p>
      </aside>

      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-16 md:py-20">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
          <h2 className="text-3xl text-navy-deep md:text-4xl">Applying at 18 and starting services at 21</h2>
          <p className="mt-6 text-lg leading-relaxed text-navy-deep">
            New Jersey accepts DDD eligibility applications from age 18. DDD services generally begin at age 21 or older,
            after eligibility and the other requirements are met. An application does not itself approve a service
            or set a start date. Families planning the move from school to adult life can begin learning about
            the process before school services end.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-navy-deep">
            Start with the State’s{' '}
            <a href="https://www.nj.gov/humanservices/ddd/individuals/apply-for-services/application/" className="font-medium underline decoration-gold decoration-2 underline-offset-4">DDD eligibility application and document checklist</a>{' '}
            and its{' '}
            <a href="https://www.nj.gov/humanservices/ddd/individuals/transition/" className="font-medium underline decoration-gold decoration-2 underline-offset-4">school-to-adult transition guidance</a>.
            DDD decides eligibility; MMD can discuss the services it provides and the referral process.
          </p>
        </div>
      </section>

      <StepsSection />

      <section className="mx-3 mt-3 rounded-[20px] bg-cream py-16 md:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div>
            <h2 className="text-3xl text-navy-deep md:text-4xl">Choosing a support coordinator</h2>
            <p className="mt-6 text-lg leading-relaxed text-navy-deep">
              A support coordinator helps develop the Individualized Service Plan, find providers and monitor
              services. Follow DDD’s instructions for selecting an agency. Ask agencies about their current
              availability, communication, experience with your goals and how they involve the person in planning.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-navy-deep">
              Read the State’s{' '}
              <a href="https://www.nj.gov/humanservices/ddd/individuals/access-services/care-management/" className="font-medium underline decoration-gold decoration-2 underline-offset-4">support coordination instructions</a>{' '}
              and use the{' '}
              <a href="https://irecord.dhs.state.nj.us/ProviderSearch" className="font-medium underline decoration-gold decoration-2 underline-offset-4">DDD provider search</a>{' '}
              to look for agencies by service and county. A directory listing does not confirm that an agency
              has an opening; contact it directly.
            </p>
          </div>
          <div>
            <h2 className="text-3xl text-navy-deep md:text-4xl">Preparing for a first conversation with MMD</h2>
            <ul className="mt-6 list-disc space-y-4 pl-5 text-lg leading-relaxed text-navy-deep">
              <li>The person’s town, preferred days and the routines or activities they want support with.</li>
              <li>Whether DDD eligibility is approved or an application is still in progress.</li>
              <li>Your support coordinator’s contact details, if you already have one.</li>
              <li>The service you are considering and any questions about staffing, introductions or scheduling.</li>
            </ul>
            <p className="mt-5 text-base leading-relaxed text-navy-deep">
              You do not need to have every answer before calling. Keep medical records and sensitive documents
              out of the website form; ask the team how to share anything needed for a referral.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-[20px] bg-paper py-20 md:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:px-12">
          <div className="max-w-xl">
            <h2 className="text-3xl text-navy-deep md:text-4xl">Services you can choose MMD for</h2>
            <p className="mt-4 text-lg leading-relaxed text-navy-deep">
              When your support coordinator asks which provider you want, these are the DDD services we deliver.
            </p>
            <ul className="mt-8 space-y-6">
              {DDD_SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services/${s.slug}`} className="font-display text-2xl font-bold text-navy underline decoration-gold/60 decoration-2 underline-offset-4 hover:decoration-gold">
                    {s.name}
                  </Link>
                  <p className="mt-2 leading-relaxed text-navy-deep">{s.lead}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="max-w-xl rounded-[20px] bg-cream p-8">
            <h2 className="text-2xl text-navy-deep">Official information</h2>
            <p className="mt-3 leading-relaxed text-navy-deep">
              Eligibility rules, assessments and budgets are set by the State. For the current details, go to the
              source:
            </p>
            <p className="mt-5 leading-relaxed text-navy-deep">
              The Supports Program and Community Care Program have different eligibility requirements and service
              arrangements. Ask your support coordinator which program applies before assuming a particular
              service or number of hours is available.
            </p>
            <a href="https://www.nj.gov/humanservices/ddd/programs-and-services/index.shtml" className="mt-5 inline-flex font-semibold text-navy underline underline-offset-4">
              Official DDD programs and services
            </a>
            <p className="mt-5 leading-relaxed text-navy-deep">
              Before services start, confirm that the service is in the approved plan and that MMD has confirmed
              staffing, the introduction and a start date. A consultation is a chance to discuss those next steps.
            </p>
            <p className="mt-6 leading-relaxed text-navy-deep">
              Would rather talk it through? Call <a href={site.phoneHref} className="font-semibold text-navy underline underline-offset-4">{site.phone}</a> or{' '}
              <Link href="/contact#book" className="font-semibold text-navy underline underline-offset-4">book a free consultation</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-[20px] bg-cream py-20 md:py-24">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
          <Faqs faqs={GETTING_STARTED_FAQS} />
        </div>
      </section>
      <CTABanner title="Questions about starting services?" />
    </>
  );
}
