import { redirect } from 'next/navigation';
import PageHeader from '@/components/crm/PageHeader';
import BoardClient from '@/components/crm/BoardClient';
import BoardSwitcher, { BoardNote } from '@/components/crm/BoardSwitcher';
import { Notice, Empty } from '@/components/crm/ui';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import type { WorkItem, Board } from '@/lib/crm/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Work board' };

export default async function BoardPage({
  searchParams,
}: { searchParams: { b?: string } }) {
  const { supabase, user, role } = await getSession();
  const writes = canWrite(role);

  // Row level security already limits this to boards the role may open, so
  // there is nothing to filter here: an invisible board simply is not returned.
  const { data: boardRows, error: boardErr } = await supabase
    .from('boards')
    .select('*')
    .eq('archived', false)
    .order('position');

  const boards = (boardRows ?? []) as Board[];

  if (boards.length === 0) {
    return (
      <>
        <PageHeader title="Work board" />
        <div className="p-5 sm:p-8">
          {boardErr
            ? <Notice tone="warn">Could not load the boards: {boardErr.message}</Notice>
            : <Empty>There is no board your role can open yet. Ask an administrator to give you access to one.</Empty>}
        </div>
      </>
    );
  }

  const wanted = searchParams.b;
  const board = boards.find((b) => b.key === wanted) ?? boards[0];
  if (wanted && !boards.some((b) => b.key === wanted)) redirect(`/dashboard/board?b=${board.key}`);

  // Cards on this board, each carrying every board it appears on so the card
  // can show where else it lives.
  const { data: linkRows } = await supabase
    .from('board_items')
    .select('task_id, position, tasks(*)')
    .eq('board_id', board.id);

  const taskIds = (linkRows ?? []).map((r) => r.task_id);

  const { data: allLinks } = taskIds.length
    ? await supabase.from('board_items').select('task_id, board_id').in('task_id', taskIds)
    : { data: [] as { task_id: string; board_id: string }[] };

  const boardsByTask = new Map<string, string[]>();
  for (const l of (allLinks ?? []) as { task_id: string; board_id: string }[]) {
    boardsByTask.set(l.task_id, [...(boardsByTask.get(l.task_id) ?? []), l.board_id]);
  }

  const items: WorkItem[] = [];
  for (const r of linkRows ?? []) {
    const t = r.tasks as unknown as WorkItem | null;
    if (!t) continue;
    items.push({ ...t, position: r.position, boardIds: boardsByTask.get(r.task_id) ?? [] });
  }

  return (
    <>
      <PageHeader
        title={board.name}
        lead={board.description ?? undefined}
        actions={<BoardNote board={board} />}
      />
      <BoardSwitcher boards={boards} current={board.key} />
      {!writes && (
        <div className="px-5 pt-5 sm:px-8">
          <Notice>This is a read only view. The operations team keeps the board up to date.</Notice>
        </div>
      )}
      <BoardClient
        items={items}
        canWrite={writes}
        userId={user?.id ?? null}
        boards={boards}
        board={board}
      />
    </>
  );
}
