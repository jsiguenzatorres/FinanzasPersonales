#!/usr/bin/env node
/**
 * Crea/actualiza usuarios de prueba (uno por plan) + un superadmin.
 * Idempotente: si el email ya existe en auth.users, solo actualiza su plan.
 *
 * Uso: node apps/web/scripts/seed-test-users.mjs
 * Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST_PASSWORD = 'FlowTest2026!';

const TEST_USERS = [
  { email: 'test.free@flowfinance.dev', displayName: 'Ana (Free)', plan: 'free', isSuperadmin: false },
  { email: 'test.starter@flowfinance.dev', displayName: 'Carlos (Starter)', plan: 'starter', isSuperadmin: false },
  { email: 'test.pro@flowfinance.dev', displayName: 'Beatriz (Pro)', plan: 'pro', isSuperadmin: false },
  { email: 'test.elite@flowfinance.dev', displayName: 'Diego (Elite)', plan: 'elite', isSuperadmin: false },
  { email: 'admin@flowfinance.dev', displayName: 'Super Admin', plan: 'elite', isSuperadmin: true },
];

async function upsertTestUser({ email, displayName, plan, isSuperadmin }) {
  let userId;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (created?.user) {
    userId = created.user.id;
    console.log(`  creado en auth.users`);
  } else {
    const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    const existing = list.users.find((u) => u.email === email);
    if (!existing) throw createError ?? new Error(`No se pudo crear ni encontrar ${email}`);
    userId = existing.id;
    console.log(`  ya existía en auth.users`);
  }

  const { error: updateError } = await admin
    .from('users')
    .update({ plan, is_superadmin: isSuperadmin, display_name: displayName, onboarding_done: true })
    .eq('id', userId);

  if (updateError) throw updateError;

  console.log(`  -> plan=${plan}${isSuperadmin ? ' [SUPERADMIN]' : ''}`);
  return { email, id: userId, plan, isSuperadmin };
}

console.log('Creando/actualizando usuarios de prueba...\n');
const results = [];
for (const u of TEST_USERS) {
  console.log(`${u.email}:`);
  results.push(await upsertTestUser(u));
}

console.log('\n=== Resumen ===');
console.table(results.map((r) => ({ email: r.email, plan: r.plan, superadmin: r.isSuperadmin })));
console.log(`\nContraseña para todos: ${TEST_PASSWORD}`);
