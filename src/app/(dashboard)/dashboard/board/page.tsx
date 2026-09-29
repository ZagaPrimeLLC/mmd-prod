import PageHeader from '@/components/crm/PageHeader';
import BoardClient from '@/components/crm/BoardClient';
import { Notice } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import type { WorkItem } from '@/lib/crm/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Work board' };

export default async function BoardPage() {
  const { supabase, user, role } = await getSession();
  const writes = canWrite(role);

  const { data, error } = await supabase.from('tasks').select('*').order('position');
  const items = (data ?? []) as WorkItem[];

  return (
    <>
      <PageHeader
        title="Work board"
        lead={
          writes
            ? 'Everything the team is carrying. Add an item to any column, and move a card with the arrows on it.'
            : 'Everything the team is carrying. This is a read only view of the board.'
        }
      />
      {error && (
        <div className="px-5 pt-5 sm:px-8">
          <Notice tone="warn">Could not load the board: {error.message}</Notice>
        </div>
      )}
      <BoardClient items={items} canWrite={writes} userId={user?.id ?? null} />
    </>
  );
}
