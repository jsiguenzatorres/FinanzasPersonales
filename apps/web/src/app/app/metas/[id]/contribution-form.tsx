'use client';

import { useState } from 'react';
import { Input, Label } from '@flowfinance/ui';
import { createGoalContributionAction } from '@/lib/goals/actions';
import { SubmitButton } from '@/components/submit-button';
import { SegmentedToggle } from '@/components/segmented-toggle';

export function ContributionForm({ goalId, currency }: { goalId: string; currency: string }) {
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={createGoalContributionAction} className="space-y-3">
      <input type="hidden" name="goal_id" value={goalId} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="direction" value={direction} />

      <SegmentedToggle
        value={direction}
        onChange={setDirection}
        options={[
          {
            value: 'deposit',
            label: 'Aportar',
            activeClassName: 'border-ff-green/40 text-ff-green',
            pillClassName: 'bg-ff-green/10',
          },
          {
            value: 'withdraw',
            label: 'Retirar',
            activeClassName: 'border-ff-red/40 text-ff-red',
            pillClassName: 'bg-ff-red/10',
          },
        ]}
      />

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

      <SubmitButton className="w-full" size="sm">
        {direction === 'deposit' ? 'Registrar aporte' : 'Registrar retiro'}
      </SubmitButton>
    </form>
  );
}
