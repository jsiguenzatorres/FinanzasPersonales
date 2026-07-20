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
import { createGoalAction, editGoalAction } from '@/lib/goals/actions';

interface AccountOption {
  id: string;
  name: string;
}

export interface GoalInitialValues {
  id: string;
  name: string;
  description: string;
  target_amount: string;
  account_id: string;
  target_date: string;
  monthly_contribution: string;
  auto_contribution_pct: string;
  priority: string;
  status: string;
}

const GOAL_TYPES = [
  { value: 'emergency_fund', label: 'Fondo de emergencia' },
  { value: 'savings', label: 'Ahorro' },
  { value: 'debt_payoff', label: 'Pago de deuda' },
  { value: 'purchase', label: 'Compra grande' },
  { value: 'travel', label: 'Viaje' },
  { value: 'education', label: 'Educación' },
  { value: 'retirement', label: 'Retiro' },
  { value: 'other', label: 'Otra' },
];

export function GoalForm({
  accounts,
  currency,
  error,
  initialValues,
}: {
  accounts: AccountOption[];
  currency: string;
  error?: string;
  initialValues?: GoalInitialValues;
}) {
  const isEditing = !!initialValues;
  const [autoPct, setAutoPct] = useState(initialValues?.auto_contribution_pct ?? '');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar meta' : 'Nueva meta'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Ajusta los detalles de tu meta' : 'Define cuánto quieres ahorrar y para qué'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={isEditing ? editGoalAction : createGoalAction} className="space-y-4">
          {isEditing && <input type="hidden" name="goal_id" value={initialValues.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Fondo de emergencia"
              defaultValue={initialValues?.name}
            />
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {GOAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="target_amount">Monto objetivo</Label>
              <Input
                id="target_amount"
                name="target_amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={initialValues?.target_amount}
              />
            </div>
            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="currency">Moneda</Label>
                <Input id="currency" name="currency" required defaultValue={currency} maxLength={3} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account_id">Cuenta donde ahorras (opcional)</Label>
            <select
              id="account_id"
              name="account_id"
              defaultValue={initialValues?.account_id ?? ''}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin cuenta específica</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="target_date">Fecha límite (opcional)</Label>
              <Input id="target_date" name="target_date" type="date" defaultValue={initialValues?.target_date} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly_contribution">Aporte mensual meta (opcional)</Label>
              <Input
                id="monthly_contribution"
                name="monthly_contribution"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialValues?.monthly_contribution}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auto_contribution_pct">
              % automático de cada ingreso confirmado (opcional)
            </Label>
            <Input
              id="auto_contribution_pct"
              name="auto_contribution_pct"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={autoPct}
              onChange={(e) => setAutoPct(e.target.value)}
              placeholder="Ej. 10"
            />
            <p className="text-xs text-muted-foreground">
              Cuando registres un ingreso ya cobrado, se sugerirá aportar este % a esta meta — tú confirmas
              el monto antes de guardar.
            </p>
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
                <option value="paused">Pausada</option>
                <option value="abandoned">Abandonada</option>
              </select>
            </div>
          )}

          <Button type="submit" className="w-full">
            {isEditing ? 'Guardar cambios' : 'Crear meta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
