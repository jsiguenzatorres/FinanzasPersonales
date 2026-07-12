import { createClient } from '@supabase/supabase-js';
import type { Database } from '@flowfinance/shared/types';

/**
 * Cliente Supabase con service_role — IGNORA RLS.
 * USAR SOLO en server actions, route handlers o jobs.
 * NUNCA exponer al cliente. NUNCA importar en código client-side.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client no debe usarse en el browser');
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
