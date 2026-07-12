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
import { createBudgetAction } from '@/lib/budgets/actions';

interface CategoryOption {
  id: string;
  name: string;
  icon: string | null;
  avgSpent: number;
}

const MODES = [
  { value: 'zero_based', label: 'Zero-Based', description: 'Cada dólar recibe asignación. Máximo control.' },
  { value: 'flexible', label: 'Flexible', description: 'Límites por categoría, sin ceremonia diaria.' },
  { value: '50_30_20', label: '50/30/20', description: 'Necesidades / deseos / ahorro.' },
];

export function BudgetForm({
  categories,
  suggestedIncome,
  error,
}: {
  categories: CategoryOption[];
  suggestedIncome: number;
  error?: string;
}) {
  const [mode, setMode] = useState('flexible');
  const [totalIncome, setTotalIncome] = useState(suggestedIncome.toFixed(2));
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const unallocated = Number(totalIncome || 0) - totalAllocated;

  const monthLabel = new Date().toLocaleDateString('es-SV', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo presupuesto</CardTitle>
        <CardDescription>Presupuesto de {monthLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={createBudgetAction} className="space-y-4">
          <input type="hidden" name="mode" value={mode} />

          <div className="space-y-1.5">
            <Label>Modo</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    mode === m.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <p className="font-medium text-foreground">{m.label}</p>
                  <p className="mt-1 text-xs">{m.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="total_income_expected">Ingreso esperado del mes</Label>
            <Input
              id="total_income_expected"
              name="total_income_expected"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={totalIncome}
              onChange={(e) => setTotalIncome(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Asignación por categoría</Label>
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <input type="hidden" name="category_id" value={c.id} />
                <div className="flex-1">
                  <p className="text-sm">
                    {c.icon} {c.name}
                  </p>
                  {c.avgSpent > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Promedio 3 meses: ${c.avgSpent.toFixed(2)}
                    </p>
                  )}
                </div>
                <Input
                  name="allocated_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-28"
                  value={allocations[c.id] ?? ''}
                  onChange={(e) => setAllocations((prev) => ({ ...prev, [c.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm">
            <p>Asignado: ${totalAllocated.toFixed(2)}</p>
            <p className={unallocated < 0 ? 'text-ff-red' : 'text-ff-green'}>
              {unallocated >= 0 ? 'Sin asignar' : 'Sobre-asignado'}: ${Math.abs(unallocated).toFixed(2)}
            </p>
            {mode === 'zero_based' && Math.abs(unallocated) > 0.01 && (
              <p className="mt-1 text-xs text-ff-yellow">
                Zero-Based funciona mejor si asignas el 100% del ingreso.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Crear presupuesto
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
