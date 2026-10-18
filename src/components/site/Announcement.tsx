import Link from 'next/link';
import { getSlot } from '@/lib/cms/read';

/**
 * A short site-wide notice from the CMS (slot global.announcement). Hidden
 * when empty, and hidden (not an error page) if it cannot be loaded: this
 * component is on every public page.
 */
export default async function Announcement() {
  let a: Awaited<ReturnType<typeof getSlot<'global.announcement'>>>;
  try {
    a = await getSlot('global.announcement');
  } catch (e) {
    console.error('cms: announcement unavailable, hiding the bar:', (e as Error).message);
    return null;
  }
  if (!a.text) return null;
  const inner = (
    <span className="mx-auto block max-w-5xl px-5 py-2.5 text-center text-[15px] font-medium text-navy-deep sm:px-8">
      {a.text}
      {a.href && <span className="ml-2 underline underline-offset-4">Read more</span>}
    </span>
  );
  return (
    <div role="status" className="bg-gold-crest">
      {a.href ? <Link href={a.href} className="block hover:bg-gold">{inner}</Link> : inner}
    </div>
  );
}
