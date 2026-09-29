import { Phone, MessageSquare, Mail, AlertTriangle, Star } from 'lucide-react';
import type { BoardCard } from '@/lib/crm-types';
import { isStale, STALE_HOURS } from '@/lib/pipeline';

const digits = (s: string) => s.replace(/\D/g, '');

function sinceLabel(iso: string | null) {
  if (!iso) return 'never contacted';
  const hrs = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ApplicantCard({ card }: { card: BoardCard }) {
  const { applicant: a } = card;
  const stale = isStale(card.lastContactAt, card.createdAt);
  const live = card.stage !== 'completed' && card.stage !== 'archived';

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold leading-tight text-gray-900">{a.name}</h3>
        {card.score != null && (
          <span className="flex shrink-0 items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
            <Star className="h-3 w-3 fill-current" />
            {card.score}
          </span>
        )}
      </div>

      <p className="mt-0.5 text-xs text-gray-500">
        {card.position?.title ?? 'No position'}
        {card.position?.location ? ` · ${card.position.location}` : ''}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        {a.source && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600">{a.source}</span>}
        {card.qualified && <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">Qualified</span>}
        {card.ready && <span className="rounded bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">Ready</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {a.phone && (
          <>
            <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 rounded bg-navy px-2.5 py-1.5 text-xs font-medium text-white">
              <Phone className="h-3 w-3" /> Call
            </a>
            <a href={`sms:${a.phone}`} className="inline-flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700">
              <MessageSquare className="h-3 w-3" /> Text
            </a>
            <a
              href={`https://wa.me/1${digits(a.phone)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700"
            >
              WhatsApp
            </a>
          </>
        )}
        {a.email && (
          <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700">
            <Mail className="h-3 w-3" /> Email
          </a>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500">
        <span>{sinceLabel(card.lastContactAt)}{card.attempts > 0 ? ` · ${card.attempts} attempt${card.attempts > 1 ? 's' : ''}` : ''}</span>
        {card.owner && <span className="font-medium text-gray-600">{card.owner}</span>}
      </div>

      {card.archiveReason && <p className="mt-2 text-[11px] italic text-gray-500">{card.archiveReason}</p>}

      {stale && live && (
        <p className="mt-2 flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
          <AlertTriangle className="h-3 w-3" /> No contact in {STALE_HOURS}h
        </p>
      )}
    </article>
  );
}
