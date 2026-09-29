import { STAGES, isStale } from '@/lib/pipeline';
import type { BoardCard } from '@/lib/crm-types';
import ApplicantCard from './ApplicantCard';
import { Users, AlertTriangle, CalendarCheck, UserCheck } from 'lucide-react';

function Stat({ icon: Icon, value, label, tone }: {
  icon: typeof Users; value: number; label: string; tone?: 'alert';
}) {
  return (
    <div className={`rounded-lg border p-4 ${tone === 'alert' && value > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tone === 'alert' && value > 0 ? 'text-red-600' : 'text-steel'}`} />
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <p className={`mt-1 text-2xl font-bold ${tone === 'alert' && value > 0 ? 'text-red-700' : 'text-navy'}`}>{value}</p>
    </div>
  );
}

export default function Board({ cards }: { cards: BoardCard[] }) {
  const live = cards.filter((c) => c.stage !== 'completed' && c.stage !== 'archived');
  const stale = live.filter((c) => isStale(c.lastContactAt, c.createdAt));
  const appts = cards.filter((c) => c.stage === 'appointment_set');
  const ready = cards.filter((c) => c.stage === 'ready' || c.stage === 'with_coordinator');

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-4 py-4 lg:grid-cols-4">
        <Stat icon={Users} value={live.length} label="In pipeline" />
        <Stat icon={UserCheck} value={ready.length} label="Ready / handed off" />
        <Stat icon={CalendarCheck} value={appts.length} label="Appointments set" />
        <Stat icon={AlertTriangle} value={stale.length} label="Stale over 48h" tone="alert" />
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-8">
        {STAGES.map((stage) => {
          const col = cards.filter((c) => c.stage === stage.key);
          return (
            <section key={stage.key} className="w-[85vw] shrink-0 sm:w-72">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-navy">{stage.label}</h2>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{col.length}</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{stage.hint}</p>

              <div className="mt-3 space-y-3">
                {col.map((c) => <ApplicantCard key={c.id} card={c} />)}
                {col.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-xs text-gray-400">
                    Nothing here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
