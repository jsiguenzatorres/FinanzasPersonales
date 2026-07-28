'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { createLoanPortfolioAction } from '@/lib/loan-portfolio/actions';

interface AccountOption {
  id: string;
  name: string;
}

export function LoanPortfolioForm({ accounts, error }: { accounts: AccountOption[]; error?: string }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo préstamo con interés</CardTitle>
        <CardDescription>Se genera la tabla de amortización completa al guardar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={createLoanPortfolioAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="borrower_name">Nombre del deudor</Label>
            <Input id="borrower_name" name="borrower_name" required placeholder="Juan Pérez" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="borrower_phone">Teléfono (opcional)</Label>
              <Input id="borrower_phone" name="borrower_phone" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="borrower_email">Correo (opcional)</Label>
              <Input id="borrower_email" name="borrower_email" type="email" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="principal">Monto prestado (capital)</Label>
              <Input id="principal" name="principal" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" name="currency" required maxLength={3} defaultValue="USD" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interest_rate_monthly">Tasa de interés mensual (%)</Label>
              <Input id="interest_rate_monthly" name="interest_rate_monthly" type="number" step="0.01" min="0.01" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interest_type">Tipo de interés</Label>
              <select
                id="interest_type"
                name="interest_type"
                required
                defaultValue="compound"
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="compound">Compuesto (cuota fija, sobre saldo)</option>
                <option value="simple">Simple (interés lineal)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="term_months">Plazo (meses)</Label>
              <Input id="term_months" name="term_months" type="number" step="1" min="1" max="360" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="late_fee_rate">Cargo por mora (%, opcional)</Label>
              <Input id="late_fee_rate" name="late_fee_rate" type="number" step="0.01" min="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Fecha de entrega</Label>
              <Input id="start_date" name="start_date" type="date" required defaultValue={today} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment_day">Día de cobro (1-31)</Label>
              <Input id="payment_day" name="payment_day" type="number" min="1" max="31" required defaultValue="1" />
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="account_id">Cuenta de origen (opcional)</Label>
              <select
                id="account_id"
                name="account_id"
                defaultValue=""
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Sin especificar</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" />
          </div>

          <Button type="submit" className="w-full">
            Crear préstamo y generar amortización
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
