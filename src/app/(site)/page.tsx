import type { Metadata } from 'next';
import JsonLd from '@/components/site/JsonLd';
import StepsSection from '@/components/site/StepsSection';
import { Intro, Figures } from '@/components/site/home/ReadingColumn';
import { HeroFilm, WhatWeDo, ContactStrip, JobsSheet, FaqSplit } from '@/components/site/home/Sections';
import CTABanner from '@/components/site/CTABanner';
import { organizationLd } from '@/lib/schema';
import { getOpenJobs } from '@/lib/public-jobs';
import { site } from '@/lib/site';
import { socialImage } from '@/lib/seo-metadata';

export const revalidate = 3600;

const shareTitle = `${site.name} | ${site.tagline}`;
const shareDescription = `${site.tagline}. Home Health Aide Services, plus NJ DDD Community-Based Supports, Individual Supports and Respite in New Jersey.`;

export const metadata: Metadata = {
  // Written for the searches families and support coordinators make.
  title: { absolute: 'Home Care & DDD Services in NJ | MMD Community Care' },
  description:
    'Home Health Aide Services for adults and seniors, plus NJ DDD Community-Based Supports, Individual Supports and Respite. Talk to MMD Community Care.',
  alternates: { canonical: '/' },
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    url: site.url,
    siteName: site.name,
    type: 'website',
    locale: 'en_US',
    images: [socialImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: shareTitle,
    description: shareDescription,
    images: [socialImage],
  },
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
        <CTABanner />
      </div>
    </>
  );
}
