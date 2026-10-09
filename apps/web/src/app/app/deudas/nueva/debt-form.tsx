'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { TrendingDown, AlertCircle } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import { createDebtAction, editDebtAction } from '@/lib/debts/actions';

export interface DebtInitialValues {
  id: string;
  name: string;
  creditor: string;
  type: string;
  original_amount: string;
  current_balance: string;
  currency: string;
  interest_rate_annual: string;
  term_months: string;
  monthly_payment: string;
  start_date: string;
  next_payment_date: string;
  next_payment_amount: string;
  notes: string;
  status: string;
}

const TYPES = [
  { value: 'personal_loan', label: 'Préstamo personal' },
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'auto_loan', label: 'Préstamo de auto' },
  { value: 'student_loan', label: 'Préstamo estudiantil' },
  { value: 'other', label: 'Otra' },
];

export function DebtForm({ error, initialValues }: { error?: string; initialValues?: DebtInitialValues }) {
  const isEditing = !!initialValues;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-red/10">
          <TrendingDown className="h-5 w-5 text-ff-red" aria-hidden="true" />
        </div>
        <CardTitle>{isEditing ? 'Editar deuda' : 'Nueva deuda'}</CardTitle>
        <CardDescription>
          Préstamos personales, hipoteca, auto, estudiantil — la deuda de tarjetas de crédito ya se
          trackea en el módulo Tarjetas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <form action={isEditing ? editDebtAction : createDebtAction} className="space-y-4">
          {isEditing && <input type="hidden" name="debt_id" value={initialValues.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Préstamo Banco Agrícola" defaultValue={initialValues?.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="creditor">Acreedor</Label>
              <Input id="creditor" name="creditor" required defaultValue={initialValues?.creditor} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue={initialValues?.type ?? 'personal_loan'}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="original_amount">Monto original</Label>
              <Input
                id="original_amount"
                name="original_amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={initialValues?.original_amount}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_balance">Saldo actual</Label>
              <Input
                id="current_balance"
                name="current_balance"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={initialValues?.current_balance}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" name="currency" required maxLength={3} defaultValue={initialValues?.currency ?? 'USD'} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interest_rate_annual">Tasa de interés anual (%)</Label>
              <Input
                id="interest_rate_annual"
                name="interest_rate_annual"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={initialValues?.interest_rate_annual}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="term_months">Plazo en meses (opcional)</Label>
              <Input id="term_months" name="term_months" type="number" step="1" min="1" defaultValue={initialValues?.term_months} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly_payment">Pago mínimo mensual (opcional)</Label>
              <Input
                id="monthly_payment"
                name="monthly_payment"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialValues?.monthly_payment}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start_date">Fecha de inicio</Label>
            <Input id="start_date" name="start_date" type="date" required defaultValue={initialValues?.start_date ?? today} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="next_payment_date">Próximo pago (opcional)</Label>
              <Input id="next_payment_date" name="next_payment_date" type="date" defaultValue={initialValues?.next_payment_date} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_payment_amount">Monto del próximo pago (opcional)</Label>
              <Input
                id="next_payment_amount"
                name="next_payment_amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialValues?.next_payment_amount}
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={initialValues.status}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="active">Activa</option>
                <option value="paid">Pagada</option>
                <option value="defaulted">En mora</option>
                <option value="restructured">Reestructurada</option>
                <option value="written_off">Incobrable</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" defaultValue={initialValues?.notes} />
          </div>

          <SubmitButton className="w-full">{isEditing ? 'Guardar cambios' : 'Crear deuda'}</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
