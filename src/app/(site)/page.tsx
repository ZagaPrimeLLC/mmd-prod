import type { Metadata } from 'next';
import JsonLd from '@/components/site/JsonLd';
import StepsSection from '@/components/site/StepsSection';
import { Intro, Figures } from '@/components/site/home/ReadingColumn';
import { HeroFilm, WhatWeDo, ContactStrip, JobsSheet, FaqSplit, CtaFilm } from '@/components/site/home/Sections';
import { organizationLd } from '@/lib/schema';
import { getOpenJobs } from '@/lib/public-jobs';

export const revalidate = 3600;

export const metadata: Metadata = {
  // Written for the searches families and support coordinators make.
  title: { absolute: 'NJ DDD Provider for Adults with Developmental Disabilities | MMD Community Care' },
  description:
    'NJ DDD approved statewide provider of Community-Based Supports, Individual Supports and Respite for adults with developmental disabilities. Free consultation.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const jobs = await getOpenJobs();
  return (
    <>
      <JsonLd data={organizationLd()} />
      <HeroFilm />
      <Intro />
      <WhatWeDo />
      <StepsSection compact />
      <Figures />
      <div className="mt-3 space-y-3">
        <ContactStrip />
        <JobsSheet jobs={jobs} />
        <FaqSplit />
        <CtaFilm />
      </div>
    </>
  );
}
