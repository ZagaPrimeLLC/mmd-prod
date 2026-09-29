import { createClient } from '@/lib/supabase/server';
import Board from '@/components/crm/Board';
import DashboardShell from '@/components/crm/DashboardShell';
import type { BoardCard } from '@/lib/crm-types';

export const metadata = { title: 'Applicant board', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Row = {
  id: string; stage: string; qualified: boolean; ready: boolean; score: number | null;
  last_contact_at: string | null; created_at: string; contact_attempts: number; archive_reason: string | null;
  applicants: { name: string; phone: string | null; email: string | null; source: string | null } | null;
  job_posts: { title: string; location: string | null } | null;
};

export default async function BoardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // hub.is_member gates every table. Without membership the board would render
  // empty and look broken, so say plainly what is missing instead.
  const { data: member } = await supabase.rpc('is_member_mmd');
  if (member === false) {
    return (
      <DashboardShell who={user?.email ?? ''}>
        <div className="m-4 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-bold text-amber-900">This account is not linked to MMD yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            You are signed in as <strong>{user?.email}</strong>, but that account has not been added
            to the MMD team, so the board is not available to it. Ask the systems administrator to
            add you.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const { data, error } = await supabase
    .from('applications')
    .select('id, stage, qualified, ready, score, last_contact_at, created_at, contact_attempts, archive_reason, applicants(name, phone, email, source), job_posts(title, location)')
    .order('created_at', { ascending: false });

  const cards: BoardCard[] = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    stage: r.stage,
    owner: null,
    qualified: r.qualified,
    ready: r.ready,
    score: r.score,
    lastContactAt: r.last_contact_at,
    createdAt: r.created_at,
    attempts: r.contact_attempts,
    archiveReason: r.archive_reason,
    applicant: r.applicants ?? { name: 'Unknown', phone: null, email: null, source: null },
    position: r.job_posts,
  }));

  return (
    <DashboardShell
      who={user?.email ?? ''}
      notice={error ? `Could not load the board: ${error.message}` : undefined}
    >
      <Board cards={cards} />
    </DashboardShell>
  );
}
