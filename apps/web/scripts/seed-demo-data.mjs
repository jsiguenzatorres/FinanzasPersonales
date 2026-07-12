#!/usr/bin/env node
/**
 * Genera un escenario completo de datos de prueba para un usuario existente:
 * 2 cuentas, 1 tarjeta de crédito, ingresos quincenales, ~20 gastos variados
 * (jun-jul 2026), cargos a tarjeta y un presupuesto del mes actual.
 * Pensado para dogfooding del flujo completo (dashboard, presupuesto,
 * tarjetas, patrimonio) sin tener que capturar todo a mano.
 *
 * Uso: node apps/web/scripts/seed-demo-data.mjs test.free@flowfinance.dev
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
const TARGET_EMAIL = process.argv[2] ?? 'test.free@flowfinance.dev';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, display_name')
    .eq('email', TARGET_EMAIL)
    .single();

  if (userError || !user) {
    console.error(`No encontré un usuario con email ${TARGET_EMAIL}. ¿Corriste seed-test-users.mjs primero?`);
    process.exit(1);
  }

  console.log(`Sembrando datos para ${user.display_name} (${TARGET_EMAIL})...\n`);

  // ─── Limpieza de un run previo (idempotente) ────────────────────────────
  await admin.from('family_loan_payments').delete().eq('user_id', user.id);
  await admin.from('family_loans').delete().eq('user_id', user.id);
  await admin.from('budget_categories').delete().in(
    'budget_id',
    (await admin.from('budgets').select('id').eq('user_id', user.id)).data?.map((b) => b.id) ?? [],
  );
  await admin.from('budgets').delete().eq('user_id', user.id);
  await admin.from('income_entries').delete().eq('user_id', user.id);
  await admin.from('transactions').delete().eq('user_id', user.id);
  await admin.from('credit_cards').delete().eq('user_id', user.id);
  await admin.from('accounts').delete().eq('user_id', user.id);
  console.log('  (datos previos de este usuario limpiados)\n');

  // ─── Categorías del sistema que vamos a usar ────────────────────────────
  const CATEGORY_NAMES = [
    'Supermercado / Despensa',
    'Restaurantes',
    'Combustible',
    'Servicios (agua, luz)',
    'Internet / Telefonía',
    'Streaming (Netflix, Spotify…)',
    'Farmacia / Medicinas',
    'Ropa / Calzado',
    'Cine / Conciertos',
    // Grupos padre — el presupuesto asigna a este nivel, no a la subcategoría
    // (update_budget_spent() resuelve subcategoría→padre antes de matchear).
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Entretenimiento',
    'Salud',
  ];
  const { data: categories, error: catError } = await admin
    .from('categories')
    .select('id, name')
    .eq('is_system', true)
    .in('name', CATEGORY_NAMES);

  if (catError) throw catError;
  const cat = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const missing = CATEGORY_NAMES.filter((n) => !cat[n]);
  if (missing.length > 0) {
    console.error(`No encontré estas categorías del sistema: ${missing.join(', ')}`);
    process.exit(1);
  }

  // ─── Cuentas ─────────────────────────────────────────────────────────────
  const { data: accounts, error: accError } = await admin
    .from('accounts')
    .insert([
      { user_id: user.id, name: 'Cuenta Corriente', type: 'checking', bank_name: 'Banco Agrícola', currency: 'USD' },
      { user_id: user.id, name: 'Ahorros Emergencia', type: 'savings', bank_name: 'Banco Agrícola', currency: 'USD' },
    ])
    .select('id, name');
  if (accError) throw accError;
  const checking = accounts.find((a) => a.name === 'Cuenta Corriente').id;
  console.log('  ✓ 2 cuentas creadas');

  // ─── Tarjeta de crédito ──────────────────────────────────────────────────
  const { data: card, error: cardError } = await admin
    .from('credit_cards')
    .insert({
      user_id: user.id,
      bank_name: 'Banco Cuscatlán',
      card_name: 'Visa Clásica',
      card_brand: 'Visa',
      currency: 'USD',
      credit_limit: 800,
      cut_day: 25,
      payment_due_day: 10,
      interest_rate_annual: 36,
    })
    .select('id')
    .single();
  if (cardError) throw cardError;
  console.log('  ✓ 1 tarjeta de crédito creada');

  // ─── Ingresos quincenales (con su transacción de cobro vinculada) ───────
  const INCOMES = [
    { date: '2026-06-15', gross: 450, net: 420 },
    { date: '2026-06-30', gross: 450, net: 420 },
    { date: '2026-07-15', gross: 450, net: 420 },
  ];
  for (const inc of INCOMES) {
    const { data: tx, error: txError } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: checking,
        kind: 'income',
        amount: inc.net,
        currency: 'USD',
        transaction_date: inc.date,
        description: 'Empresa Textiles S.A. — planilla',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (txError) throw txError;

    const { error: incError } = await admin.from('income_entries').insert({
      user_id: user.id,
      account_id: checking,
      transaction_id: tx.id,
      type: 'salary',
      source_name: 'Empresa Textiles S.A.',
      gross_amount: inc.gross,
      net_amount: inc.net,
      deductions: [{ name: 'ISSS + AFP', amount: inc.gross - inc.net, type: 'other' }],
      currency: 'USD',
      income_date: inc.date,
      is_collected: true,
    });
    if (incError) throw incError;
  }
  console.log(`  ✓ ${INCOMES.length} ingresos de planilla registrados`);

  // ─── Presupuesto de julio 2026 (antes de insertar los gastos de julio) ──
  const { data: budget, error: budgetError } = await admin
    .from('budgets')
    .insert({
      user_id: user.id,
      period_start: '2026-07-01',
      period_end: '2026-07-31',
      mode: 'flexible',
      total_income_expected: 840,
      currency: 'USD',
    })
    .select('id')
    .single();
  if (budgetError) throw budgetError;

  // update_budget_spent() resuelve cada transacción a su categoría PADRE antes
  // de buscar la línea de presupuesto — así que budget_categories.category_id
  // debe ser el grupo padre (Alimentación), no la subcategoría (Restaurantes).
  await admin.from('budget_categories').insert([
    { budget_id: budget.id, category_id: cat['Alimentación'], allocated_amount: 300 },
    { budget_id: budget.id, category_id: cat['Transporte'], allocated_amount: 80 },
    { budget_id: budget.id, category_id: cat['Vivienda'], allocated_amount: 70 },
    { budget_id: budget.id, category_id: cat['Entretenimiento'], allocated_amount: 25 },
    { budget_id: budget.id, category_id: cat['Salud'], allocated_amount: 40 },
  ]);
  console.log('  ✓ presupuesto de julio creado (5 grupos)');

  // ─── Gastos (cuenta corriente) — junio y julio ──────────────────────────
  const EXPENSES = [
    ['2026-06-02', 'Supermercado / Despensa', 'Super Selectos', 65.4],
    ['2026-06-05', 'Servicios (agua, luz)', 'CAESS', 28.0],
    ['2026-06-05', 'Internet / Telefonía', 'Claro', 35.0],
    ['2026-06-08', 'Restaurantes', 'Pollo Campero', 12.5],
    ['2026-06-10', 'Combustible', 'Puma', 30.0],
    ['2026-06-14', 'Streaming (Netflix, Spotify…)', 'Netflix', 9.99],
    ['2026-06-16', 'Supermercado / Despensa', 'Super Selectos', 58.2],
    ['2026-06-18', 'Farmacia / Medicinas', 'Farmacia San Nicolás', 18.75],
    ['2026-06-20', 'Combustible', 'Texaco', 28.0],
    ['2026-06-22', 'Ropa / Calzado', 'Siman', 45.0],
    ['2026-06-25', 'Restaurantes', 'Starbucks', 6.5],
    ['2026-06-28', 'Servicios (agua, luz)', 'CAESS', 30.0],
    ['2026-07-01', 'Internet / Telefonía', 'Claro', 35.0],
    ['2026-07-02', 'Supermercado / Despensa', 'Super Selectos', 72.1],
    ['2026-07-04', 'Combustible', 'Puma', 30.0],
    ['2026-07-06', 'Restaurantes', 'Pollo Campero', 15.2],
    ['2026-07-08', 'Streaming (Netflix, Spotify…)', 'Netflix', 9.99],
    ['2026-07-10', 'Farmacia / Medicinas', 'Farmacia San Nicolás', 22.0],
    ['2026-07-11', 'Supermercado / Despensa', 'Super Selectos', 40.0],
  ];
  const expenseRows = EXPENSES.map(([date, catName, merchant, amount]) => ({
    user_id: user.id,
    account_id: checking,
    category_id: cat[catName],
    kind: 'expense',
    amount,
    currency: 'USD',
    transaction_date: date,
    merchant_name: merchant,
    capture_source: 'manual',
  }));
  const { data: insertedExpenses, error: expError } = await admin
    .from('transactions')
    .insert(expenseRows)
    .select('id, transaction_date, merchant_name, amount');
  if (expError) throw expError;
  console.log(`  ✓ ${expenseRows.length} gastos registrados (jun-jul)`);

  // ─── Cargos a tarjeta de crédito ─────────────────────────────────────────
  const CC_CHARGES = [
    ['2026-06-12', 'Ropa / Calzado', 'Siman', 85.0],
    ['2026-06-30', 'Cine / Conciertos', 'Cinépolis', 22.0],
    ['2026-07-05', 'Restaurantes', 'Olive Garden', 38.5],
  ];
  const ccRows = CC_CHARGES.map(([date, catName, merchant, amount]) => ({
    user_id: user.id,
    card_id: card.id,
    category_id: cat[catName],
    kind: 'cc_charge',
    amount,
    currency: 'USD',
    transaction_date: date,
    merchant_name: merchant,
    capture_source: 'manual',
  }));
  const { error: ccError } = await admin.from('transactions').insert(ccRows);
  if (ccError) throw ccError;
  console.log(`  ✓ ${ccRows.length} cargos a tarjeta registrados`);

  // ─── Préstamos familiares (MOD-13) — cubre las 3 modalidades + vínculo
  // retroactivo parcial, para poder probar el módulo completo ────────────

  // Préstamo 1: efectivo a "Mario" (hermano) — vencido, con abono parcial.
  {
    const { data: tx, error: txErr } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: checking,
        kind: 'transfer_out',
        amount: 100,
        currency: 'USD',
        transaction_date: '2026-06-20',
        merchant_name: 'Mario',
        description: 'Préstamo familiar — Mario',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (txErr) throw txErr;

    const { data: loan, error: loanErr } = await admin
      .from('family_loans')
      .insert({
        user_id: user.id,
        person_name: 'Mario',
        relationship: 'Hermano',
        original_amount: 100,
        balance: 100,
        currency: 'USD',
        delivery_date: '2026-06-20',
        delivery_method: 'cash',
        origin_account_id: checking,
        transaction_id: tx.id,
        category: 'Deudas / créditos',
        agreed_payment_date: '2026-07-01', // ya pasó → aparece vencido
      })
      .select('id')
      .single();
    if (loanErr) throw loanErr;

    // Abono parcial de $40 el 2026-07-05
    const { data: payTx, error: payTxErr } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: checking,
        kind: 'income',
        amount: 40,
        currency: 'USD',
        transaction_date: '2026-07-05',
        description: 'Abono de préstamo — Mario',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (payTxErr) throw payTxErr;

    await admin.from('family_loan_payments').insert({
      user_id: user.id,
      loan_id: loan.id,
      amount: 40,
      destination_account_id: checking,
      transaction_id: payTx.id,
      resulting_balance: 60,
      paid_at: '2026-07-05',
    });
    await admin.from('family_loans').update({ balance: 60 }).eq('id', loan.id);
  }

  // Préstamo 2: compra con tarjeta para "Ana" (hermana) — activo, sin abonar aún.
  {
    const { data: tx, error: txErr } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        card_id: card.id,
        kind: 'cc_charge',
        amount: 65,
        currency: 'USD',
        transaction_date: '2026-07-03',
        merchant_name: 'Ana',
        description: 'Préstamo familiar — Ana',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (txErr) throw txErr;

    await admin.from('family_loans').insert({
      user_id: user.id,
      person_name: 'Ana',
      relationship: 'Hermana',
      original_amount: 65,
      balance: 65,
      currency: 'USD',
      delivery_date: '2026-07-03',
      delivery_method: 'credit_purchase',
      origin_card_id: card.id,
      transaction_id: tx.id,
      category: 'Alimentos',
    });
  }

  // Préstamo 3: retiro de efectivo con tarjeta para "Carlos" (primo) — el
  // caso caro que FINN debe advertir: sin período de gracia.
  {
    const { data: tx, error: txErr } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        card_id: card.id,
        kind: 'cc_cash_advance',
        amount: 150,
        currency: 'USD',
        transaction_date: '2026-06-25',
        merchant_name: 'Carlos',
        description: 'Préstamo familiar — Carlos (retiro de efectivo)',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (txErr) throw txErr;

    await admin.from('family_loans').insert({
      user_id: user.id,
      person_name: 'Carlos',
      relationship: 'Primo',
      original_amount: 150,
      balance: 150,
      currency: 'USD',
      delivery_date: '2026-06-25',
      delivery_method: 'credit_cash_advance',
      origin_card_id: card.id,
      transaction_id: tx.id,
      category: 'Gastos médicos',
    });
  }

  // Préstamo 4: vínculo retroactivo PARCIAL — la mitad del súper del
  // 2026-07-02 ($72.10) era para "Mamá". Prueba linked_amount + que el
  // presupuesto solo excluya esa porción, no el gasto completo.
  {
    const target = insertedExpenses.find(
      (e) => e.transaction_date === '2026-07-02' && e.merchant_name === 'Super Selectos',
    );
    if (!target) throw new Error('No encontré el gasto de referencia para el vínculo retroactivo parcial');

    const linkedAmount = Math.round((target.amount / 2) * 100) / 100;
    await admin.from('family_loans').insert({
      user_id: user.id,
      person_name: 'Mamá',
      relationship: 'Madre',
      original_amount: linkedAmount,
      balance: linkedAmount,
      currency: 'USD',
      delivery_date: target.transaction_date,
      delivery_method: 'debit',
      origin_account_id: checking,
      transaction_id: target.id,
      linked_amount: linkedAmount,
      category: 'Alimentos',
      notes: 'Mitad del súper del 2 de julio — la otra mitad es gasto propio',
    });
  }

  // Préstamo 5: ya pagado — para ver el estado "Pagado" en la lista.
  {
    const { data: tx, error: txErr } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: checking,
        kind: 'transfer_out',
        amount: 50,
        currency: 'USD',
        transaction_date: '2026-06-01',
        merchant_name: 'Sofía',
        description: 'Préstamo familiar — Sofía',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (txErr) throw txErr;

    const { data: loan, error: loanErr } = await admin
      .from('family_loans')
      .insert({
        user_id: user.id,
        person_name: 'Sofía',
        relationship: 'Amiga',
        original_amount: 50,
        balance: 50,
        currency: 'USD',
        delivery_date: '2026-06-01',
        delivery_method: 'transfer',
        origin_account_id: checking,
        transaction_id: tx.id,
        category: 'Otro',
      })
      .select('id')
      .single();
    if (loanErr) throw loanErr;

    const { data: payTx, error: payTxErr } = await admin
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: checking,
        kind: 'income',
        amount: 50,
        currency: 'USD',
        transaction_date: '2026-06-15',
        description: 'Abono de préstamo — Sofía',
        capture_source: 'manual',
      })
      .select('id')
      .single();
    if (payTxErr) throw payTxErr;

    await admin.from('family_loan_payments').insert({
      user_id: user.id,
      loan_id: loan.id,
      amount: 50,
      destination_account_id: checking,
      transaction_id: payTx.id,
      resulting_balance: 0,
      paid_at: '2026-06-15',
    });
    await admin.from('family_loans').update({ balance: 0, status: 'paid' }).eq('id', loan.id);
  }

  console.log('  ✓ 5 préstamos familiares registrados (efectivo, compra con tarjeta, retiro de efectivo, vínculo parcial, pagado)');

  // ─── Resumen final ───────────────────────────────────────────────────────
  const { data: finalAccounts } = await admin.from('accounts').select('name, balance').eq('user_id', user.id);
  const { data: finalCard } = await admin
    .from('credit_cards')
    .select('card_name, current_balance, credit_limit, utilization_pct')
    .eq('user_id', user.id);
  const { data: finalBudget } = await admin
    .from('budget_categories')
    .select('category_id, allocated_amount, spent_amount, status')
    .eq('budget_id', budget.id);
  const { data: finalLoans } = await admin
    .from('family_loans')
    .select('person_name, delivery_method, original_amount, linked_amount, balance, status')
    .eq('user_id', user.id)
    .order('delivery_date', { ascending: true });

  console.log('\n=== Saldos resultantes ===');
  console.table(finalAccounts);
  console.table(finalCard);
  console.log('=== Presupuesto de julio (Alimentación debe reflejar el vínculo parcial de Mamá) ===');
  console.table(finalBudget);
  console.log('=== Préstamos familiares ===');
  console.table(finalLoans);

  console.log(`\nListo. Inicia sesión como ${TARGET_EMAIL} para ver el escenario completo.`);
}

main().catch((err) => {
  console.error('\nError sembrando datos:', err);
  process.exit(1);
});
