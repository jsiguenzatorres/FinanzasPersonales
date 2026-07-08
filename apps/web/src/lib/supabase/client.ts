import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para componentes cliente (browser).
 * Usa anon key — solo respeta RLS.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
