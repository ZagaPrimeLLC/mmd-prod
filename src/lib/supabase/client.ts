'use client';
import { createBrowserClient } from '@supabase/ssr';

const SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? 'proj_mmd';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: SCHEMA } }
  );
}
