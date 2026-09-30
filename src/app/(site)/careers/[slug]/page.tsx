import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Briefcase, Check, Clock, DollarSign, ExternalLink, GraduationCap, MapPin, Phone, Share2,
} from 'lucide-react';
import JobApplyForm from '@/components/site/JobApplyForm';
import { JobDescription } from '@/lib/job-format';
import { getOpenJob, getOpenJobs } from '@/lib/public-jobs';
import { EMPLOYMENT_LABEL, WORK_MODE_LABEL, payLabel, postedLabel, type Job } from '@/lib/jobs';
import { site, onboardingChecks } from '@/lib/site';

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getOpenJobs()).map((j) => ({ slug: j.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await getOpenJob(slug);
  if (!job) return { title: 'Position closed', robots: { index: false } };
  const description =
    job.summary ?? `${job.title} with ${site.name}${job.location ? ` in ${job.location}` : ''}. Apply online in a couple of minutes.`;
  return {
    title: `${job.title}${job.location ? ` · ${job.location}` : ''}`,
    description,
    alternates: { canonical: `/careers/${job.slug}` },
    openGraph: { title: job.title, description, type: 'website', url: `/careers/${job.slug}` },
  };
}

const EMPLOYMENT_SCHEMA: Record<Job['employment_type'], string> = {
  full_time: 'FULL_TIME', part_time: 'PART_TIME', per_diem: 'PER_DIEM', contract: 'CONTRACTOR',
};
const UNIT: Record<Job['pay_interval'], string> = { hour: 'HOUR', week: 'WEEK', year: 'YEAR' };

/** Google for Jobs reads this. Location is free text, so pull out what we can. */
function jobPostingLd(job: Job) {
  const m = job.location?.match(/^(.*?),?\s*(NJ|New Jersey)\b\s*(\d{5})?/i);
  const town = (m?.[1] || job.location || '').replace(/^.*-\s*/, '').trim();
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: (job.description ?? job.summary ?? job.title).replace(/\*\*/g, '').replace(/^#+\s*/gm, ''),
    datePosted: job.posted_at ?? job.created_at,
    employmentType: EMPLOYMENT_SCHEMA[job.employment_type],
    directApply: true,
    identifier: job.requisition_id ? { '@type': 'PropertyValue', name: site.legalName, value: job.requisition_id } : undefined,
    hiringOrganization: { '@type': 'Organization', name: site.legalName, sameAs: site.url, logo: `${site.url}${site.logo}` },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: town || undefined,
        addressRegion: 'NJ',
        postalCode: m?.[3],
        addressCountry: 'US',
      },
    },
    ...(job.work_mode === 'remote' ? { jobLocationType: 'TELECOMMUTE', applicantLocationRequirements: { '@type': 'State', name: 'New Jersey' } } : {}),
  };
  if (job.pay_min != null || job.pay_max != null) {
    ld.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        ...(job.pay_min != null && job.pay_max != null && job.pay_min !== job.pay_max
          ? { minValue: job.pay_min, maxValue: job.pay_max }
          : { value: job.pay_min ?? job.pay_max }),
        unitText: UNIT[job.pay_interval],
      },
    };
  }
  // "<" escaped so text typed into a job post can never close this script tag.
  return JSON.stringify(ld).replace(/</g, '\\u003c');
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getOpenJob(slug);
  if (!job) notFound();

  const pay = payLabel(job);
  const facts = [
    job.location && { icon: MapPin, label: 'Location', value: `${job.location}${job.work_mode !== 'onsite' ? ` · ${WORK_MODE_LABEL[job.work_mode]}` : ''}` },
    { icon: Briefcase, label: 'Job type', value: EMPLOYMENT_LABEL[job.employment_type] },
    pay && { icon: DollarSign, label: 'Pay', value: pay },
    job.experience && { icon: GraduationCap, label: 'Experience', value: job.experience },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jobPostingLd(job) }} />

      <section className="bg-navy text-white">
        <div className="mx-auto w-full max-w-7xl px-5 pb-12 pt-8 sm:px-8 lg:px-12">
          <Link href="/careers#openings" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All open positions
          </Link>
          <h1 className="mt-5 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">{job.title}</h1>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-white/90">
            {facts.slice(0, 3).map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-center gap-2"><Icon className="h-5 w-5 text-gold" /><span className="sr-only">{label}: </span>{value}</li>
            ))}
            {job.posted_at && <li className="flex items-center gap-2"><Clock className="h-5 w-5 text-gold" />{postedLabel(job.posted_at)}</li>}
          </ul>
          <a href="#apply" className="mt-7 inline-flex rounded-lg bg-gold px-7 py-3.5 font-bold text-navy shadow-lg hover:bg-gold-dark lg:hidden">
            Apply now
          </a>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:px-12">
          <article className="min-w-0">
            {job.summary && <p className="text-lg leading-relaxed text-gray-800 sm:text-xl">{job.summary}</p>}

            <dl className="mt-8 grid gap-4 rounded-2xl bg-cream p-5 sm:grid-cols-2">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
                    <dd className="font-semibold text-navy">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {job.description && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-navy">About the role</h2>
                <div className="mt-4"><JobDescription text={job.description} /></div>
              </div>
            )}

            {job.benefits.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-bold text-navy">Benefits</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {job.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 rounded-lg bg-gold/10 px-4 py-3 text-gray-800">
                      <Check className="h-5 w-5 shrink-0 text-navy" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10">
              <h2 className="text-2xl font-bold text-navy">Screening and training</h2>
              <p className="mt-3 text-gray-700">Every Direct Support Professional completes these, and we walk you through each one:</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {onboardingChecks.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-steel" /> {c}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-10 text-sm leading-relaxed text-gray-500">
              {site.legalName} is an equal opportunity employer. We do not discriminate on the basis of race, colour,
              religion, sex, national origin, age, disability or any other protected characteristic.
            </p>
          </article>

          <aside id="apply" className="scroll-mt-24">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg lg:sticky lg:top-28">
              <h2 className="text-xl font-bold text-navy">Apply for this job</h2>
              <p className="mt-1 text-sm text-gray-600">Takes about two minutes. We will call you back.</p>
              <div className="mt-5">
                <JobApplyForm jobId={job.id} jobTitle={job.title} />
              </div>
              <div className="mt-6 space-y-2 border-t border-gray-100 pt-5 text-sm">
                {job.apply_url && (
                  <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 font-semibold text-steel hover:underline">
                    <ExternalLink className="h-4 w-4" /> Apply on CareerPlug instead
                  </a>
                )}
                <a href={site.phoneHref} className="flex items-center gap-2 font-semibold text-steel hover:underline">
                  <Phone className="h-4 w-4" /> Questions? Call {site.phone}
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Job: ${job.title}`)}&body=${encodeURIComponent(`${site.url}/careers/${job.slug}`)}`}
                  className="flex items-center gap-2 font-semibold text-steel hover:underline"
                >
                  <Share2 className="h-4 w-4" /> Send this job to a friend
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
