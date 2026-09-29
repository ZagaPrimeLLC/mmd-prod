import { createClient } from '@/lib/supabase/server';
import { STAGES, isStale } from '@/lib/pipeline';
import { site } from '@/lib/site';

export const metadata = { title: 'Applicant board', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  stage: string;
  last_contact_at: string | null;
  created_at: string;
  applicants: { name: string; phone: string | null; email: string | null; source: string | null } | null;
  job_posts: { title: string; location: string | null } | null;
};

export default async function BoardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('applications')
    .select('id, stage, last_contact_at, created_at, applicants(name, phone, email, source), job_posts(title, location)')
    .order('created_at', { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-navy/60">MMD COMMUNITY CARE</p>
            <h1 className="text-lg font-bold text-navy">Applicant board</h1>
          </div>
          <span className="truncate text-xs text-slate-500">{user?.email}</span>
        </div>
      </header>

      {error && (
        <p className="m-4 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
          Could not load the board: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="m-4 rounded-lg border border-dashed border-slate-300 bg-white p-6">
          <h2 className="font-semibold text-navy">No applicants yet</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Import a CareerPlug CSV to fill the board. Walk-in window is {site.walkIn}.
          </p>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto p-4">
        {STAGES.map((stage) => {
          const cards = rows.filter((r) => r.stage === stage.key);
          return (
            <section key={stage.key} className="w-[85vw] shrink-0 sm:w-72">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-navy">{stage.label}</h2>
                <span className="text-xs text-slate-500">{cards.length}</span>
              </div>
              <p className="text-xs text-slate-500">{stage.hint}</p>

              <div className="mt-3 space-y-3">
                {cards.map((c) => {
                  const stale = isStale(c.last_contact_at, c.created_at);
                  return (
                    <article key={c.id} className="rounded-lg border bg-white p-3 shadow-sm">
                      <h3 className="font-semibold">{c.applicants?.name ?? 'Unknown'}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {c.job_posts?.title ?? 'No position'}
                        {c.job_posts?.location ? ` · ${c.job_posts.location}` : ''}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {c.applicants?.phone && (
                          <>
                            <a href={`tel:${c.applicants.phone}`} className="rounded bg-navy px-2.5 py-1.5 font-medium text-white">Call</a>
                            <a href={`sms:${c.applicants.phone}`} className="rounded border px-2.5 py-1.5 font-medium">Text</a>
                            <a href={`https://wa.me/${c.applicants.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded border px-2.5 py-1.5 font-medium">WhatsApp</a>
                          </>
                        )}
                        {c.applicants?.email && (
                          <a href={`mailto:${c.applicants.email}`} className="rounded border px-2.5 py-1.5 font-medium">Email</a>
                        )}
                      </div>
                      {stale && stage.key !== 'completed' && stage.key !== 'archived' && (
                        <p className="mt-2 text-xs font-medium text-red-700">No contact in 48h</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
