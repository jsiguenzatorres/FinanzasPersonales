import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@flowfinance/shared/types';

/**
 * Cliente Supabase para componentes cliente (browser).
 * Usa anon key — solo respeta RLS.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
