import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createManualLiabilityAction, deleteManualLiabilityAction } from '@/lib/net-worth/actions';

const LIABILITY_TYPES = [
  { value: 'personal_loan', label: 'Préstamo personal' },
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'auto_loan', label: 'Crédito de auto' },
  { value: 'student_loan', label: 'Crédito educativo' },
  { value: 'other', label: 'Otro' },
];

export default async function ManualLiabilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: liabilities }, { data: currencies }] = await Promise.all([
    supabase
      .from('manual_liabilities')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('currencies').select('code').eq('is_active', true).order('code'),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl">Pasivos manuales</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agregar pasivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              {error}
            </p>
          )}
          <form action={createManualLiabilityAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required placeholder="Préstamo BBVA auto" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {LIABILITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Monto</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
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
                  {(currencies ?? []).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {!liabilities || liabilities.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Sin pasivos manuales registrados.
          </p>
        ) : (
          liabilities.map((l) => (
            <Card key={l.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {LIABILITY_TYPES.find((t) => t.value === l.type)?.label ?? l.type}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-ff-red">
                    {new Intl.NumberFormat('es-SV', {
                      style: 'currency',
                      currency: l.currency,
                    }).format(l.amount)}
                  </p>
                  <form action={deleteManualLiabilityAction}>
                    <input type="hidden" name="liability_id" value={l.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
