import type { Metadata } from 'next';
import Image from 'next/image';
import { Check, MapPin, Clock } from 'lucide-react';
import PageHero from '@/components/site/PageHero';
import CareersForm from '@/components/site/CareersForm';
import { createClient } from '@/lib/supabase/server';
import { site, onboardingChecks } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Caregiver jobs',
  description:
    'Become a Direct Support Professional with MMD Community Care. Open DSP positions across New Jersey, flexible schedules, full training and certification support.',
  alternates: { canonical: '/careers' },
};

export const revalidate = 300;

type Post = { id: string; title: string; location: string | null; posted_at: string | null };

export default async function CareersPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('job_posts')
    .select('id, title, location, posted_at')
    .eq('published', true)
    .eq('status', 'open')
    .order('posted_at', { ascending: false });

  const roles = (data ?? []) as Post[];

  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="Better care starts with you"
        lead="Join a team of dedicated professionals making a real difference in the lives of adults with special needs across New Jersey."
        image="/images/team.png"
        imageAlt="MMD Direct Support Professionals outside the South Plainfield office"
      />

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-navy md:text-3xl">Open positions</h2>

              {roles.length > 0 ? (
                <ul className="mt-8 space-y-4">
                  {roles.map((r) => (
                    <li key={r.id} className="rounded-xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-bold text-navy">{r.title}</h3>
                      {r.location && (
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-steel" /> {r.location}
                        </p>
                      )}
                      <p className="mt-3 text-sm text-gray-600">
                        Apply using the form on this page, or call {site.phone}.
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-6">
                  <h3 className="font-bold text-navy">No positions listed right now</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    We hire continuously across New Jersey. Register your interest with the form and
                    we will contact you when a case opens near you.
                  </p>
                </div>
              )}

              <div className="mt-8 rounded-xl bg-cream p-6">
                <p className="flex items-center gap-2 font-semibold text-navy">
                  <Clock className="h-5 w-5 text-steel" /> Prefer to come in?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  Walk-in hours for applications and paperwork are <strong>{site.walkIn}</strong> at{' '}
                  {site.address.street}, {site.address.city}, {site.address.state} {site.address.zip}.
                </p>
              </div>

              <h3 className="mt-10 font-bold text-navy">What the role requires</h3>
              <ul className="mt-4 space-y-2.5">
                {onboardingChecks.map((c) => (
                  <li key={c} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-steel" />
                    <span className="text-sm text-gray-700">{c}</span>
                  </li>
                ))}
              </ul>

              <Image
                src="/images/community-walk.png"
                alt="An MMD Direct Support Professional supporting a client in the community"
                width={1200}
                height={900}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="mt-10 rounded-2xl shadow-lg"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 p-7 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-navy">Apply now</h2>
              <p className="mt-2 text-sm text-gray-600">
                It takes a couple of minutes. We will call you to talk it through.
              </p>
              <div className="mt-6">
                <CareersForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
