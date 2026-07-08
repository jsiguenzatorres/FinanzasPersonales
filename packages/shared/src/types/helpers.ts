import type { Database } from './database';

/**
 * Helpers para acceder a tipos de tablas sin repetir la ruta completa.
 * Uso: Tables<'transactions'>, TablesInsert<'accounts'>, Enums<'transaction_kind'>
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
