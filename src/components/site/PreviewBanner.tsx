import { draftMode } from 'next/headers';

/** Shown only to a staff browser in Draft Mode, so a preview is never mistaken for the live site. */
export default async function PreviewBanner() {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return null;
  return (
    <div role="status" className="sticky top-0 z-[60] flex items-center justify-center gap-4 bg-amber-400 px-4 py-2 text-sm font-medium text-navy-deep">
      Previewing unpublished content. Only you can see this.
      <a href="/api/cms/preview?exit=1&to=/" className="rounded-full bg-navy-deep px-3 py-1 text-xs font-semibold text-white hover:bg-navy">Exit preview</a>
    </div>
  );
}
