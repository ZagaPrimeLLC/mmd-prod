import { CtaFilm } from '@/components/site/home/Sections';

/** Every page closes on the same film and the same offer. */
export default function CTABanner({ title = 'Talk to us about your family' }: { title?: string }) {
  return <div className="mt-3"><CtaFilm title={title} /></div>;
}
