import { notFound } from 'next/navigation';
import Shell from '@/components/crm/Shell';
import PageHeader from '@/components/crm/PageHeader';
import BoardClient from '@/components/crm/BoardClient';
import BoardSwitcher, { BoardNote } from '@/components/crm/BoardSwitcher';
import { Notice } from '@/components/crm/ui';
import { sampleWork, sampleBoards } from '@/lib/sample-crm';

export const metadata = { title: 'CRM design preview', robots: { index: false } };

// Design review only. Renders the shell and board from static sample data so the
// layout can be reviewed without a login. Never available in production.
export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <Shell who="design.preview@mmd" profile={{ display_name: 'Design Preview', avatar_url: null, job_title: 'Operations' }} role="ops">
      <PageHeader
        title="Operations"
        lead="The day to day board. Recruitment, coordination, compliance and everything the office is carrying."
        actions={<BoardNote board={sampleBoards[0]} />}
      />
      <BoardSwitcher boards={sampleBoards} current="operations" />
      <div className="px-5 pt-5 sm:px-8">
        <Notice>Design preview. Static sample data, not connected to the database.</Notice>
      </div>
      <BoardClient items={sampleWork} canWrite userId="me" boards={sampleBoards} board={sampleBoards[0]} />
    </Shell>
  );
}
