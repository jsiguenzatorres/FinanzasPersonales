'use client';

import { useState } from 'react';
import { Button, Input, Label } from '@flowfinance/ui';
import { cn } from '@flowfinance/ui';
import { createGoalContributionAction } from '@/lib/goals/actions';

export function ContributionForm({ goalId, currency }: { goalId: string; currency: string }) {
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createGoalContributionAction} className="space-y-3">
      <input type="hidden" name="goal_id" value={goalId} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="direction" value={direction} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDirection('deposit')}
          className={cn(
            'flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors',
            direction === 'deposit'
              ? 'border-ff-green/40 bg-ff-green/10 text-ff-green'
              : 'border-border text-muted-foreground',
          )}
        >
          Aportar
        </button>
        <button
          type="button"
          onClick={() => setDirection('withdraw')}
          className={cn(
            'flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors',
            direction === 'withdraw'
              ? 'border-ff-red/40 bg-ff-red/10 text-ff-red'
              : 'border-border text-muted-foreground',
          )}
        >
          Retirar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Monto</Label>
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contribution_date">Fecha</Label>
          <Input id="contribution_date" name="contribution_date" type="date" required defaultValue={today} />
        </div>
      </div>

      <Button type="submit" className="w-full" size="sm">
        {direction === 'deposit' ? 'Registrar aporte' : 'Registrar retiro'}
      </Button>
    </form>
  );
}
