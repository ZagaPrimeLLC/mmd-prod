import { NextResponse, type NextRequest } from 'next/server';
import { draftMode } from 'next/headers';
import { getSession } from '@/lib/crm/session';
import { canWrite } from '@/lib/crm/nav';
import { PREVIEW_COOKIE } from '@/lib/cms/read';

/**
 * Opens the public site in Draft Mode showing one chosen revision, for staff
 * who may edit content. Preview is uncached and only for this browser; the
 * public cache is never touched. `?exit=1` leaves preview.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const to = url.searchParams.get('to') ?? '/';
  const safeTo = /^\/(?!\/|dashboard|api)[A-Za-z0-9/_?=&#%.-]*$/.test(to) ? to : '/';
  const dm = await draftMode();

  if (url.searchParams.get('exit') === '1') {
    dm.disable();
    const res = NextResponse.redirect(new URL(safeTo, url.origin));
    res.cookies.set(PREVIEW_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  const { supabase, role } = await getSession();
  if (!canWrite(role)) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 });

  const rev = url.searchParams.get('rev') ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(rev)) return NextResponse.json({ error: 'Bad revision.' }, { status: 400 });
  const { data } = await supabase.from('cms_revisions').select('id, slot_key').eq('id', rev).maybeSingle();
  if (!data) return NextResponse.json({ error: 'Revision not found.' }, { status: 404 });

  dm.enable();
  const res = NextResponse.redirect(new URL(safeTo, url.origin));
  res.cookies.set(PREVIEW_COOKIE, JSON.stringify({ rev: data.id, slot: data.slot_key }), {
    path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60,
  });
  return res;
}
