import { createClient } from '@supabase/supabase-js';
import { JOB_COLUMNS, type Job } from '@/lib/jobs';

/**
 * Jobs as a member of the public sees them. Deliberately an anonymous client
 * with no cookies: a signed-in team member browsing /careers gets exactly the
 * public view (never a draft), and the pages can be cached, then refreshed the
 * moment a job is published or closed in the CRM.
 */
function anon() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'proj_mmd' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getOpenJobs(): Promise<Job[]> {
  const { data, error } = await anon()
    .from('job_posts')
    .select(JOB_COLUMNS)
    .eq('published', true)
    .eq('status', 'open')
    .order('posted_at', { ascending: false, nullsFirst: false });
  if (error) console.error('careers: could not load jobs', error.message);
  return (data ?? []) as Job[];
}

export async function getOpenJob(slug: string): Promise<Job | null> {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  const { data } = await anon()
    .from('job_posts')
    .select(JOB_COLUMNS)
    .eq('slug', slug)
    .eq('published', true)
    .eq('status', 'open')
    .maybeSingle();
  return (data as Job | null) ?? null;
}
