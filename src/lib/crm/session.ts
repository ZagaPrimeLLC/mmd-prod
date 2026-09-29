import { createClient } from '@/lib/supabase/server';
import type { Role } from './nav';

const KNOWN: Role[] = ['admin', 'ops', 'leadership', 'viewer'];

/**
 * Who is signed in and what they may do. Any role string the database holds
 * that this app does not recognise is treated as a viewer, so a typo in a
 * membership row can never hand someone write access by accident.
 */
export async function getSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: raw } = await supabase.rpc('mmd_role');
  const role = (KNOWN as string[]).includes(raw as string) ? (raw as Role) : raw ? 'viewer' : null;
  return { supabase, user, email: user?.email ?? '', role };
}
