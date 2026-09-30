import { createClient } from '@/lib/supabase/server';
import type { Role } from './nav';

const KNOWN: Role[] = ['admin', 'ops', 'leadership', 'viewer'];

/**
 * Who is signed in and what they may do.
 *
 * The role lookup lives in proj_mmd, because the Supabase client is pinned to
 * that schema and every rpc() call resolves against it. A lookup that failed
 * used to be indistinguishable from a user with no role, which sent a real
 * administrator to the "not on the team" screen. The two are now separate:
 * `failed` means we could not ask, `role === null` means we asked and the
 * answer was nobody.
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: raw, error } = await supabase.rpc('mmd_role');

  const role = (KNOWN as string[]).includes(raw as string)
    ? (raw as Role)
    : raw
      ? 'viewer'
      : null;

  return {
    supabase,
    user,
    email: user?.email ?? '',
    role: error ? null : role,
    failed: error ? error.message : null,
  };
}
