import ArtImage from '@/components/site/ArtImage';
import Breadcrumbs, { type Crumb } from '@/components/site/Breadcrumbs';
import type { Photo } from '@/lib/photos';

/**
 * The opening of every inner page: the photograph across the full width in
 * the shape that fits the screen, the headline laid over it. Breadcrumbs tell
 * people and Google where the page sits.
 */
export default function PageHero({
  title, lead, photo, crumbs, children,
}: {
  title: string;
  lead?: string;
  photo: Photo;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  return (
    <section className="mx-3 mt-3 overflow-hidden rounded-[20px] bg-navy-deep text-paper">
      <div className="relative flex min-h-[min(calc(100svh-84px),46rem)] flex-col justify-end">
        <ArtImage photo={photo} priority className="mmd-drift" position="center 12%" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />{/* taste-skill-ignore: scrim over the photo so the text reads */}
        <div className="relative px-6 pb-12 pt-32 sm:px-12 lg:pb-16">
          {crumbs && <Breadcrumbs trail={crumbs} tone="dark" />}
          <h1 className="mt-6 max-w-[20ch] animate-mmd-rise text-[2rem] sm:text-[3.25rem] xl:text-[4rem]">{title}</h1>
          {lead && (
            <p className="mt-5 max-w-[52ch] animate-mmd-rise text-lg leading-[1.55] [animation-delay:90ms] md:text-xl">{lead}</p>
          )}
          {children && <div className="mt-8 animate-mmd-rise [animation-delay:180ms]">{children}</div>}
        </div>
      </div>
    </section>
  );
}
