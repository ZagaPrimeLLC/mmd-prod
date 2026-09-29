import TopBar from '@/components/site/TopBar';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopBar />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
