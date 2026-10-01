import TopBar from '@/components/site/TopBar';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import ChatAssistant from '@/components/site/ChatAssistant';
import SiteTracking from '@/components/site/SiteTracking';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="mmd-skip">
        Skip to main content
      </a>
      <TopBar />
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <ChatAssistant />
      <SiteTracking />
    </>
  );
}
