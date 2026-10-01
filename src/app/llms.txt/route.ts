import { site, serviceDetail } from '@/lib/site';
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
    `${site.name} supports adults with intellectual and developmental disabilities across New Jersey, at home and in the community. Services are funded through the NJ Division of Developmental Disabilities (DDD); families usually arrange them with their DDD support coordinator.`,
    '',
    '## Services',
    ...serviceDetail.map((s) => `- [${s.name}](${u}/services): ${s.lead} Includes: ${s.includes.join(', ')}.`),
    '',
    '## Contact',
    `- Phone: ${site.phone}`,
    `- Email: ${site.email}`,
    `- Office: ${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`,
    `- Walk-in hours (applications and paperwork): ${site.walkIn}`,
    `- [Book a free consultation](${u}/contact)`,
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
