import { Label } from '@flowfinance/ui';
import type { MySpace } from '@/lib/collab/get-my-spaces';

/** Select para etiquetar un registro con un espacio compartido — oculto si el usuario no tiene espacios. */
export function SpaceSelect({ spaces, defaultValue }: { spaces: MySpace[]; defaultValue?: string }) {
  if (spaces.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <Label htmlFor="collab_space_id">Compartir con espacio (opcional)</Label>
      <select
        id="collab_space_id"
        name="collab_space_id"
        defaultValue={defaultValue ?? ''}
        className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Personal (solo yo)</option>
        {spaces.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
