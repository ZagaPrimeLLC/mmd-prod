import Breadcrumbs, { type Crumb } from '@/components/site/Breadcrumbs';
import CountyMap from '@/components/site/CountyMap';
import { AREAS } from '@/lib/seo-content';

export default function AreaHero({ title, lead, crumbs, county }: { title: string; lead: string; crumbs: Crumb[]; county?: string }) {
  return (
    <section className="mx-3 mt-3 grid overflow-hidden rounded-[20px] bg-navy-deep text-paper lg:grid-cols-[1.3fr_1fr]">
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:py-20">
        <Breadcrumbs trail={crumbs} tone="dark" />
        <h1 className="mt-10 max-w-[18ch] text-[2.5rem] leading-[1.08] sm:text-[3.5rem] xl:text-[4.25rem]">{title}</h1>
        <p className="mt-7 max-w-[48ch] text-lg leading-relaxed text-paper/90">{lead}</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-5 bg-cream px-8 py-12 text-navy-deep lg:py-16">
        <CountyMap pages={AREAS.map(a => a.slug)} highlight={county} />
        <p className="text-center text-sm font-medium">{county ? 'Your county, highlighted in gold' : 'Explore DDD support and Home Health Aide Services'}</p>
      </div>
    </section>
  );
}
