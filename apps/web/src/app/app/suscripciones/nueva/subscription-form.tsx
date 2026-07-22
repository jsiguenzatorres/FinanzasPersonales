'use client';

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
import { createSubscriptionAction, editSubscriptionAction } from '@/lib/subscriptions/actions';

interface CategoryOption {
  id: string;
  name: string;
}

export interface SubscriptionInitialValues {
  id: string;
  service_name: string;
  plan: string;
  amount: string;
  currency: string;
  frequency: string;
  next_charge_date: string;
  start_date: string;
  category_id: string;
  cancel_url: string;
  notes: string;
  usage_score: string;
  is_active: boolean;
}

const FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export function SubscriptionForm({
  categories,
  error,
  initialValues,
}: {
  categories: CategoryOption[];
  error?: string;
  initialValues?: SubscriptionInitialValues;
}) {
  const isEditing = !!initialValues;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar suscripción' : 'Nueva suscripción'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Ajusta los detalles' : 'Registra un servicio que se cobra periódicamente'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={isEditing ? editSubscriptionAction : createSubscriptionAction} className="space-y-4">
          {isEditing && <input type="hidden" name="subscription_id" value={initialValues.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="service_name">Servicio</Label>
            <Input
              id="service_name"
              name="service_name"
              required
              placeholder="Netflix"
              defaultValue={initialValues?.service_name}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plan">Plan (opcional)</Label>
            <Input id="plan" name="plan" placeholder="Premium" defaultValue={initialValues?.plan} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={initialValues?.amount}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" name="currency" required maxLength={3} defaultValue={initialValues?.currency ?? 'USD'} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="frequency">Frecuencia</Label>
            <select
              id="frequency"
              name="frequency"
              required
              defaultValue={initialValues?.frequency ?? 'monthly'}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Desde</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                required
                defaultValue={initialValues?.start_date ?? today}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next_charge_date">Próximo cobro</Label>
              <Input
                id="next_charge_date"
                name="next_charge_date"
                type="date"
                required
                defaultValue={initialValues?.next_charge_date ?? today}
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="category_id">Categoría (opcional)</Label>
              <select
                id="category_id"
                name="category_id"
                defaultValue={initialValues?.category_id ?? ''}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cancel_url">Enlace para cancelar (opcional)</Label>
            <Input id="cancel_url" name="cancel_url" placeholder="https://..." defaultValue={initialValues?.cancel_url} />
          </div>

          {isEditing && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="usage_score">¿Qué tanto la usas? (1-5, opcional)</Label>
                <Input
                  id="usage_score"
                  name="usage_score"
                  type="number"
                  min="1"
                  max="5"
                  defaultValue={initialValues.usage_score}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={initialValues.is_active}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="is_active" className="cursor-pointer font-normal">
                  Sigue activa
                </Label>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" defaultValue={initialValues?.notes} />
          </div>

          <Button type="submit" className="w-full">
            {isEditing ? 'Guardar cambios' : 'Crear suscripción'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
