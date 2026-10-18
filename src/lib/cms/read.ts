import { unstable_cache, unstable_noStore as noStore } from 'next/cache';
import { cookies, draftMode } from 'next/headers';
import { createClient as anonClient } from '@supabase/supabase-js';
import { createClient as memberClient } from '@/lib/supabase/server';
import { slotByKey, validate, type Content, type SlotKey, type SlotType } from '@/lib/cms/slots';
import type { Schedule } from '@/lib/booking';

/**
 * Server-only reads of published content. The published revision of a slot is
 * cached and tagged (`cms:<key>`), so publishing refreshes exactly the pages
 * that show it. Until a slot has been published the site shows the built-in
 * default from the registry. In Draft Mode an authorized staff member sees the
 * exact revision they chose to preview, read uncached through their own login.
 */
export type SlotContent<K extends SlotKey> = Content[SlotType<K>];

export const PREVIEW_COOKIE = 'mmd_preview';

function anon() {
  return anonClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    db: { schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'proj_mmd' },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// One cache entry per slot, tagged with the slot, so a publish refreshes only
// that slot. Failed reads throw; only a successful null read means unpublished.
const caches = new Map<string, () => Promise<unknown>>();
function published(key: string): Promise<unknown> {
  let fn = caches.get(key);
  if (!fn) {
    fn = unstable_cache(
      async (): Promise<unknown> => {
        const { data, error } = await anon().rpc('cms_published_content', { p_key: key });
        if (error) throw new Error(error.message);
        return data ?? null;
      },
      ['cms-published', key],
      { tags: slotTags(key), revalidate: 3600 }
    );
    caches.set(key, fn);
  }
  return fn();
}

async function previewContent(key: string): Promise<unknown> {
  try {
    const { isEnabled } = await draftMode();
    if (!isEnabled) return null;
    const raw = (await cookies()).get(PREVIEW_COOKIE)?.value;
    if (!raw) return null;
    const { rev, slot } = JSON.parse(raw) as { rev?: string; slot?: string };
    if (!rev || slot !== key) return null;
    // Read as the signed-in member: row-level security decides whether they may see this draft.
    const sb = await memberClient();
    const { data } = await sb.from('cms_revisions').select('content').eq('id', rev).eq('slot_key', key).maybeSingle();
    return data?.content ?? null;
  } catch {
    return null;
  }
}

/** The content to render for a slot: previewed draft, else published, else the built-in default. */
export async function getSlot<K extends SlotKey>(key: K): Promise<SlotContent<K>> {
  const def = slotByKey(key)!;
  let raw = await previewContent(key);
  if (raw == null) {
    raw = await published(key);
  }
  if (raw) {
    const v = validate(def.type, raw);
    if (v.ok) return v.content as SlotContent<K>;
    throw new Error(`Published content is invalid: ${key}`);
  }
  return def.default as SlotContent<K>;
}

/**
 * Marketing copy (hero, intro, FAQ): if the database cannot be reached, show
 * the built-in text rather than an error page. Only for slots where the
 * built-in text is safe to show; never for office hours.
 */
export async function getSlotSafe<K extends SlotKey>(key: K): Promise<SlotContent<K>> {
  try {
    return await getSlot(key);
  } catch (e) {
    console.error(`cms: ${key} unavailable, showing the built-in text:`, (e as Error).message);
    return slotByKey(key)!.default as SlotContent<K>;
  }
}

/** The office schedule every public page agrees on (booking slots, walk-in status, hours text). */
export async function getSchedule(): Promise<Schedule> {
  try {
    return await getSlot('settings.office_hours');
  } catch (e) {
    // A production build must not bake "hours unavailable" into every page or
    // silently make the whole site dynamic: fail the build so it is retried.
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      throw new Error(`cms: office hours could not be read during the build: ${(e as Error).message}`);
    }
    // At runtime, never cache the unavailable state as page HTML.
    noStore();
    console.error('cms: office hours unavailable:', (e as Error).message);
    return { days: [], start: 0, end: 0, closed: [], unavailable: true };
  }
}

/** Cache tags for a slot publish. */
export function slotTags(key: string): string[] {
  return ['cms', `cms:${key}`];
}
