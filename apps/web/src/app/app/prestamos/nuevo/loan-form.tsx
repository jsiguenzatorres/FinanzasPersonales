'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { createFamilyLoanAction } from '@/lib/loans/actions';

const DELIVERY_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'debit', label: 'Débito' },
  { value: 'credit_purchase', label: 'Compra con tarjeta para el familiar' },
  { value: 'credit_cash_advance', label: 'Retiro de efectivo con tarjeta' },
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'crypto', label: 'Otra criptomoneda' },
];

const LOAN_CATEGORIES = [
  'Alimentos',
  'Reparación hogar',
  'Reparación carro',
  'Colegiatura',
  'Recibos / servicios',
  'Gastos médicos',
  'Deudas / créditos',
  'Ropa',
  'Evento / celebración',
  'Herramientas / negocio',
  'Viaje / transporte',
  'Otro',
];

interface AccountOption {
  id: string;
  name: string;
  currency: string;
}

interface CardOption {
  id: string;
  label: string;
  currency: string;
}

interface CurrencyOption {
  code: string;
}

export interface ExistingTransaction {
  id: string;
  amount: number;
  currency: string;
  merchant_name: string | null;
  description: string | null;
  transaction_date: string;
}

export function LoanForm({
  accounts,
  cards,
  currencies,
  error,
  existingTransaction,
}: {
  accounts: AccountOption[];
  cards: CardOption[];
  currencies: CurrencyOption[];
  error?: string;
  existingTransaction?: ExistingTransaction;
}) {
  const [deliveryMethod, setDeliveryMethod] = useState('cash');
  const [confirmedCashAdvance, setConfirmedCashAdvance] = useState(false);
  const [linkedAmount, setLinkedAmount] = useState(existingTransaction ? String(existingTransaction.amount) : '');
  const isRetroactive = !!existingTransaction;

  const isCardDelivery = deliveryMethod === 'credit_purchase' || deliveryMethod === 'credit_cash_advance';
  const isCashAdvance = deliveryMethod === 'credit_cash_advance';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRetroactive ? 'Vincular gasto a préstamo' : 'Nuevo préstamo familiar'}</CardTitle>
        <CardDescription>
          {isRetroactive
            ? 'Marca este gasto (o una parte) como dinero prestado, no gastado'
            : 'Sin interés — control de dinero prestado a familia o amigos'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={createFamilyLoanAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="person_name">Nombre del deudor</Label>
            <Input id="person_name" name="person_name" required placeholder="Nombre de la persona" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="relationship">Relación (opcional)</Label>
            <Input id="relationship" name="relationship" placeholder="Hermano, prima, amigo..." />
          </div>

          {isRetroactive ? (
            <>
              <input type="hidden" name="existing_transaction_id" value={existingTransaction.id} />
              <input type="hidden" name="currency" value={existingTransaction.currency} />
              <input type="hidden" name="delivery_date" value={existingTransaction.transaction_date} />
              <input type="hidden" name="delivery_method" value="transfer" />
              <input type="hidden" name="original_amount" value={linkedAmount} />

              <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
                <p className="font-medium">
                  {existingTransaction.merchant_name || existingTransaction.description || 'Gasto'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {existingTransaction.transaction_date} · monto total{' '}
                  {new Intl.NumberFormat('es-SV', {
                    style: 'currency',
                    currency: existingTransaction.currency,
                  }).format(existingTransaction.amount)}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="linked_amount">¿Cuánto de este gasto es el préstamo?</Label>
                <Input
                  id="linked_amount"
                  name="linked_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={existingTransaction.amount}
                  required
                  value={linkedAmount}
                  onChange={(e) => setLinkedAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deja el monto completo si todo el gasto fue para tu familiar, o ajústalo si solo una
                  parte lo es.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="original_amount">Monto</Label>
                  <Input
                    id="original_amount"
                    name="original_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    name="currency"
                    required
                    defaultValue="USD"
                    className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="delivery_date">Fecha de entrega</Label>
                <Input
                  id="delivery_date"
                  name="delivery_date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="delivery_method">Modalidad de entrega</Label>
                <select
                  id="delivery_method"
                  name="delivery_method"
                  required
                  value={deliveryMethod}
                  onChange={(e) => {
                    setDeliveryMethod(e.target.value);
                    setConfirmedCashAdvance(false);
                  }}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {DELIVERY_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {isCashAdvance && (
                <div className="space-y-2 rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3">
                  <p className="text-sm text-ff-red">
                    🤖 <strong>FINN:</strong> Alerta máxima. Un retiro de efectivo con tarjeta NO tiene
                    período de gracia — los intereses corren desde hoy mismo, más la comisión de retiro
                    (3-5% + $2-5). Es la forma más cara de prestar dinero. Si puedes, usa transferencia o
                    efectivo de tu cuenta de ahorro en su lugar.
                  </p>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={confirmedCashAdvance}
                      onChange={(e) => setConfirmedCashAdvance(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    Entiendo el costo y quiero continuar de todas formas
                  </label>
                </div>
              )}

              {isCardDelivery ? (
                <div className="space-y-1.5">
                  <Label htmlFor="origin_card_id">Tarjeta usada</Label>
                  <select
                    id="origin_card_id"
                    name="origin_card_id"
                    required
                    className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.currency})
                      </option>
                    ))}
                  </select>
                  {cards.length === 0 && (
                    <p className="text-xs text-ff-red">No tienes tarjetas activas registradas.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="origin_account_id">Cuenta de origen</Label>
                  <select
                    id="origin_account_id"
                    name="origin_account_id"
                    required
                    className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                  {accounts.length === 0 && (
                    <p className="text-xs text-ff-red">No tienes cuentas activas registradas.</p>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría de destino (opcional)</Label>
            <select
              id="category"
              name="category"
              defaultValue=""
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin categoría</option>
              {LOAN_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agreed_payment_date">Fecha de pago acordada (opcional)</Label>
            <Input id="agreed_payment_date" name="agreed_payment_date" type="date" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Notas adicionales" />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              !isRetroactive &&
              ((isCardDelivery && cards.length === 0) ||
                (!isCardDelivery && accounts.length === 0) ||
                (isCashAdvance && !confirmedCashAdvance))
            }
          >
            {isRetroactive ? 'Vincular préstamo' : 'Registrar préstamo'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
