import { notFound } from 'next/navigation';
import Shell from '@/components/crm/Shell';
import PageHeader from '@/components/crm/PageHeader';
import BoardClient from '@/components/crm/BoardClient';
import { Notice } from '@/components/crm/ui';
import { sampleWork } from '@/lib/sample-crm';

export const metadata = { title: 'CRM design preview', robots: { index: false } };

// Design review only. Renders the shell and board from static sample data so the
// layout can be reviewed without a login. Never available in production.
export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <Shell who="design.preview@mmd" role="ops">
      <PageHeader
        title="Work board"
        lead="Everything the team is carrying. Add an item to any column, and move a card with the arrows on it."
      />
      <div className="px-5 pt-5 sm:px-8">
        <Notice>Design preview. Static sample data, not connected to the database.</Notice>
      </div>
      <BoardClient items={sampleWork} canWrite userId="me" />
    </Shell>
  );
}
