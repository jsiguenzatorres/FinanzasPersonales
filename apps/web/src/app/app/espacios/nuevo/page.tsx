import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { Users } from 'lucide-react';
import { createSpaceAction } from '@/lib/collab/actions';
import { SubmitButton } from '@/components/submit-button';

const KIND_OPTIONS = [
  { value: 'couple', label: 'Pareja' },
  { value: 'family', label: 'Familia' },
  { value: 'roommates', label: 'Compañeros de cuarto' },
  { value: 'business', label: 'Negocio' },
  { value: 'other', label: 'Otro' },
];

export default function NewSpacePage() {
  return (
    <div className="mx-auto max-w-md">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] bg-ff-purple/10">
            <Users className="h-5 w-5 text-ff-purple" aria-hidden="true" />
          </div>
          <CardTitle>Crear espacio compartido</CardTitle>
          <CardDescription>Invita a tu pareja, familia o compañeros a ver sus finanzas juntos</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSpaceAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del espacio</Label>
              <Input id="name" name="name" required placeholder="Familia Pérez" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kind">Tipo</Label>
              <select
                id="kind"
                name="kind"
                required
                defaultValue="family"
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {KIND_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton className="w-full">Crear espacio</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
