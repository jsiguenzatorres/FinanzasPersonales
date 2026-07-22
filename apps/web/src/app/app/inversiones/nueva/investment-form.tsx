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
import { COMMON_COINGECKO_IDS } from '@flowfinance/shared/schemas';
import { createInvestmentAction, editInvestmentAction } from '@/lib/investments/actions';

export interface InvestmentInitialValues {
  id: string;
  name: string;
  ticker: string;
  type: string;
  broker: string;
  currency: string;
  quantity: string;
  avg_cost: string;
  current_price: string;
  coingecko_id: string;
  notes: string;
  is_active: boolean;
}

const TYPES = [
  { value: 'stock', label: 'Acción' },
  { value: 'etf', label: 'ETF' },
  { value: 'mutual_fund', label: 'Fondo mutuo' },
  { value: 'bond', label: 'Bono' },
  { value: 'cete', label: 'CETE' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'real_estate', label: 'Bien raíz' },
  { value: 'business_equity', label: 'Participación de negocio' },
  { value: 'other', label: 'Otra' },
];

export function InvestmentForm({
  error,
  initialValues,
}: {
  error?: string;
  initialValues?: InvestmentInitialValues;
}) {
  const isEditing = !!initialValues;
  const [type, setType] = useState(initialValues?.type ?? 'stock');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar inversión' : 'Nueva inversión'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Ajusta los detalles' : 'Registra una acción, ETF, cripto u otro activo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={isEditing ? editInvestmentAction : createInvestmentAction} className="space-y-4">
          {isEditing && <input type="hidden" name="investment_id" value={initialValues.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required placeholder="Apple Inc." defaultValue={initialValues?.name} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticker">Ticker (opcional)</Label>
              <Input id="ticker" name="ticker" placeholder="AAPL" defaultValue={initialValues?.ticker} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                value={type}
                onChange={(e) => setType(e.target.value)}
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

          <div className="space-y-1.5">
            <Label htmlFor="broker">Bróker / plataforma (opcional)</Label>
            <Input id="broker" name="broker" defaultValue={initialValues?.broker} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Cantidad</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.00000001"
                min="0"
                required
                defaultValue={initialValues?.quantity}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" name="currency" required maxLength={3} defaultValue={initialValues?.currency ?? 'USD'} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="avg_cost">Costo promedio por unidad</Label>
              <Input
                id="avg_cost"
                name="avg_cost"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={initialValues?.avg_cost}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current_price">Precio actual (opcional)</Label>
              <Input
                id="current_price"
                name="current_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialValues?.current_price}
              />
            </div>
          </div>

          {type === 'crypto' && (
            <div className="space-y-1.5">
              <Label htmlFor="coingecko_id">Id de CoinGecko (para actualizar precio automático)</Label>
              <Input
                id="coingecko_id"
                name="coingecko_id"
                list="coingecko-ids"
                placeholder="bitcoin"
                defaultValue={initialValues?.coingecko_id}
              />
              <datalist id="coingecko-ids">
                {COMMON_COINGECKO_IDS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.ticker})
                  </option>
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Elige de la lista o escribe el id exacto de coingecko.com/es/monedas/... — sin esto, el
                precio se actualiza a mano.
              </p>
            </div>
          )}

          {isEditing && (
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
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" defaultValue={initialValues?.notes} />
          </div>

          <Button type="submit" className="w-full">
            {isEditing ? 'Guardar cambios' : 'Crear inversión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
