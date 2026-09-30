import PageHeader from '@/components/crm/PageHeader';
import SettingsClient from '@/components/crm/SettingsClient';
import IntakeKeys, { type IntakeKey } from '@/components/crm/IntakeKeys';
import { Card, CardHead } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import { site } from '@/lib/site';
import type { Board } from '@/lib/crm/board';
import { Building2, ShieldCheck, Database } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const { supabase, user, role } = await getSession();

  if (!canWrite(role)) {
    return (
      <>
        <PageHeader title="Settings" />
        <div className="p-5 sm:p-8">
          <Card>
            <div className="p-6">
              <ShieldCheck className="h-7 w-7 text-slate-400" />
              <h2 className="mt-3 font-bold text-navy-deep">Settings are for the operations team</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Your role can use the CRM but not configure it. Ask an administrator if something
                needs changing.
              </p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  const isAdmin = role === 'admin';
  const [boardsRes, teamRes, keysRes] = await Promise.all([
    supabase.from('boards').select('*').eq('archived', false).order('position'),
    supabase.rpc('team_list'),
    isAdmin
      ? supabase.from('intake_keys').select('id, label, source, key_prefix, created_at, last_used_at, revoked_at').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as IntakeKey[] }),
  ]);

  const boards = (boardsRes.data ?? []) as Board[];
  const team = (teamRes.data ?? []) as {
    user_id: string; email: string; role: string;
    job_title: string | null; last_sign_in_at: string | null;
  }[];

  return (
    <>
      <PageHeader
        title="Settings"
        lead="Boards, who can open them, and who is on the team."
      />

      <SettingsClient
        boards={boards}
        team={team}
        isAdmin={isAdmin}
        meId={user?.id ?? null}
      />

      {isAdmin && (
        <div id="intake" className="scroll-mt-6 px-5 pb-6 sm:px-8">
          <IntakeKeys keys={(keysRes.data ?? []) as IntakeKey[]} endpoint={`${site.url}/api/intake`} />
        </div>
      )}

      <div className="grid gap-6 px-5 pb-8 sm:px-8 xl:grid-cols-2">
        <Card>
          <CardHead title="Agency details" sub="Shown across the public website" icon={Building2} />
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ['Legal name', site.legalName],
              ['Phone', site.phone],
              ['Email', site.email],
              ['Office', `${site.address.street}, ${site.address.city}, ${site.address.state} ${site.address.zip}`],
              ['Walk-in hours', site.walkIn],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap justify-between gap-3 px-5 py-3">
                <dt className="text-slate-600">{k}</dt>
                <dd className="text-right font-medium text-navy-deep">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            These live in the site content file and change with a deploy, so the website and the
            CRM can never disagree about them.
          </p>
        </Card>

        <Card>
          <CardHead title="How access works" sub="What each role can do" icon={Database} />
          <dl className="divide-y divide-slate-100 text-sm">
            {[
              ['Administrator', 'Everything, including changing roles and creating boards.'],
              ['Operations', 'Runs the boards, recruitment, onboarding and training. Cannot change roles.'],
              ['Leadership', 'Opens the boards shared with leadership. Changes nothing.'],
              ['Viewer', 'Read only, and only boards explicitly shared with viewers.'],
            ].map(([k, v]) => (
              <div key={k} className="px-5 py-3">
                <dt className="font-semibold text-navy-deep">{k}</dt>
                <dd className="mt-0.5 text-xs leading-relaxed text-slate-600">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">
            A role is checked by the database on every request, so restricting a board actually
            withholds its cards rather than hiding a link. Someone new must sign in once before a
            role can be given to them.
          </p>
        </Card>
      </div>
    </>
  );
}
