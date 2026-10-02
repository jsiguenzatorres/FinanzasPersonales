'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@flowfinance/ui';
import { createTripAction, editTripAction } from '@/lib/trips/actions';

export interface TripInitialValues {
  id: string;
  destination: string;
  destination_country: string;
  start_date: string;
  end_date: string;
  travelers_count: string;
  budget: string;
  budget_currency: string;
  notes: string;
  status: string;
}

export function TripForm({ error, initialValues }: { error?: string; initialValues?: TripInitialValues }) {
  const isEditing = !!initialValues;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar viaje' : 'Nuevo viaje'}</CardTitle>
        <CardDescription>Destino, fechas y presupuesto — el clima y el itinerario se generan después</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <form action={isEditing ? editTripAction : createTripAction} className="space-y-4">
          {isEditing && <input type="hidden" name="trip_id" value={initialValues.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="destination">Destino</Label>
            <Input
              id="destination"
              name="destination"
              required
              placeholder="Cancún, México"
              defaultValue={initialValues?.destination}
            />
            <p className="text-xs text-muted-foreground">
              Escribe ciudad y país para que el clima se ubique bien (ej. &quot;Antigua, Guatemala&quot;)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Fecha de inicio</Label>
              <Input id="start_date" name="start_date" type="date" required defaultValue={initialValues?.start_date ?? today} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">Fecha de fin</Label>
              <Input id="end_date" name="end_date" type="date" required defaultValue={initialValues?.end_date ?? today} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="travelers_count">Viajeros</Label>
              <Input
                id="travelers_count"
                name="travelers_count"
                type="number"
                min="1"
                max="50"
                required
                defaultValue={initialValues?.travelers_count ?? '1'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget_currency">Moneda del presupuesto</Label>
              <Input id="budget_currency" name="budget_currency" required maxLength={3} defaultValue={initialValues?.budget_currency ?? 'USD'} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="budget">Presupuesto total</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={initialValues?.budget}
            />
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
                <option value="planning">Planeando</option>
                <option value="active">En curso</option>
                <option value="completed">Completado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" defaultValue={initialValues?.notes} />
          </div>

          <Button type="submit" className="w-full">
            {isEditing ? 'Guardar cambios' : 'Crear viaje'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
