import { getSchedule } from '@/lib/cms/read';
import { officeHoursLabel } from '@/lib/booking';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import ChatAssistant from '@/components/site/ChatAssistant';
import SiteTracking from '@/components/site/SiteTracking';
import Announcement from '@/components/site/Announcement';
import PreviewBanner from '@/components/site/PreviewBanner';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const schedule = await getSchedule();
  const hours = officeHoursLabel(schedule);
  return (
    <div className="mmd-site">
      <PreviewBanner />
      <a href="#main" className="mmd-skip">
        Skip to main content
      </a>
      <Announcement />
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <ChatAssistant hours={hours} unavailable={Boolean(schedule.unavailable)} />
      <SiteTracking />
    </div>
  );
}
