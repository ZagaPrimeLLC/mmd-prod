import { HOME_CARE } from '@/lib/home-care';
import { site } from '@/lib/site';
import { DDD_SERVICES, AREAS } from '@/lib/seo-content';
import { getOpenJobs } from '@/lib/public-jobs';
import { EMPLOYMENT_LABEL, payLabel } from '@/lib/jobs';

// A plain-text summary for AI assistants (https://llmstxt.org). Built from the
// same content as the site and the live job list, so it cannot drift from them.
export const revalidate = 3600;

export async function GET() {
  const jobs = await getOpenJobs();
  const u = site.url;

  const lines = [
    `# ${site.legalName}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} supports adults with intellectual and developmental disabilities across New Jersey, at home and in the community. These DDD services are funded through the NJ Division of Developmental Disabilities (DDD); families usually arrange them with their DDD support coordinator.`,
    '',
    '## Home Care Services',
    `- [Home Health Aide Services](${u}/services/home-health-aide): ${HOME_CARE.description} Contact the team to confirm home-care coverage, scheduling and payment options.`,
    '',
    '## Services (NJ DDD)',
    ...DDD_SERVICES.map((s) => `- [${s.name}](${u}/services/${s.slug}): ${s.lead} Includes: ${s.helpsWith.join(', ')}.`),
    `- [How to start DDD services](${u}/getting-started): eligibility, support coordinators, assessment and choosing a provider.`,
    '',
    '## Areas served',
    `DDD services: every county in New Jersey. Home-care availability is confirmed with the team. County pages: ${AREAS.map((a) => `[${a.name}](${u}/areas/${a.slug})`).join(', ')}.`,
    '',
    '## Contact',
    `- Phone: ${site.phone}`,
    `- Email: ${site.email}`,
    `- [Contact details and free consultations](${u}/contact)`,
    '',
    '## Careers',
    `MMD hires Direct Support Professionals (DSPs) across New Jersey. Every DSP clears federal and NJ background screening, fingerprinting, drug screening and Central Registry checks, and holds CPR and First Aid certification. Apply at ${u}/careers.`,
    '',
    ...(jobs.length
      ? jobs.map((j) => {
          const pay = payLabel(j);
          return `- [${j.title}](${u}/careers/${j.slug}): ${[j.location, EMPLOYMENT_LABEL[j.employment_type], pay].filter(Boolean).join(' · ')}`;
        })
      : ['- No positions are listed right now; register interest on the careers page.']),
    '',
    '## Pages',
    `- [About](${u}/about)`,
    `- [Mission](${u}/mission)`,
    `- [Services](${u}/services)`,
    `- [Careers](${u}/careers)`,
    `- [Contact](${u}/contact)`,
    `- [Privacy policy](${u}/privacy)`,
    `- [Notice of privacy practices](${u}/notice-of-privacy-practices)`,
    `- [Nondiscrimination and language assistance](${u}/nondiscrimination)`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
