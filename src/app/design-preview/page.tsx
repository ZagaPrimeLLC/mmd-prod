import { notFound } from 'next/navigation';
import Board from '@/components/crm/Board';
import DashboardShell from '@/components/crm/DashboardShell';
import { sampleBoard } from '@/lib/sample-board';

export const metadata = { title: 'CRM design preview', robots: { index: false } };

// Design review only. Renders the board from static sample data so the UI can be
// reviewed without a login. Never available in production.
export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <DashboardShell who="design preview — sample data" notice="Sample data for design review. Not connected to the database.">
      <Board cards={sampleBoard} />
    </DashboardShell>
  );
}
