import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { Wallet, AlertCircle } from 'lucide-react';
import { SubmitButton } from '@/components/submit-button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createManualAssetAction, deleteManualAssetAction } from '@/lib/net-worth/actions';

const ASSET_TYPES = [
  { value: 'real_estate', label: 'Bienes raíces' },
  { value: 'vehicle', label: 'Vehículo' },
  { value: 'collectible', label: 'Colección / Joyería' },
  { value: 'crypto', label: 'Cripto (fuera de cuentas)' },
  { value: 'other', label: 'Otro' },
];

export default async function ManualAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: assets }, { data: currencies }] = await Promise.all([
    supabase
      .from('manual_assets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('currencies').select('code').eq('is_active', true).order('code'),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-2xl">Activos manuales</h1>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-green/10">
            <Wallet className="h-5 w-5 text-ff-green" aria-hidden="true" />
          </div>
          <CardTitle className="text-base">Agregar activo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-ff-red/25 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          <form action={createManualAssetAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required placeholder="Toyota Corolla 2020" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="value">Valor</Label>
                <Input id="value" name="value" type="number" step="0.01" min="0.01" required />
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
            <SubmitButton className="w-full">Agregar</SubmitButton>
          </form>
        </CardContent>
      </Card>

      {!assets || assets.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">Sin activos manuales registrados.</p>
      ) : (
        <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-card">
          {assets.map((a, i) => (
            <div
              key={a.id}
              className={`flex items-center justify-between px-4 py-3 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ASSET_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-mono text-ff-green">
                  {new Intl.NumberFormat('es-SV', {
                    style: 'currency',
                    currency: a.currency,
                  }).format(a.value)}
                </p>
                <form action={deleteManualAssetAction}>
                  <input type="hidden" name="asset_id" value={a.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Eliminar
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
