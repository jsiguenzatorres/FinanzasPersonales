'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CategorySlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  value: number;
}

function CustomTooltip({
  active,
  payload,
  fmt,
}: {
  active?: boolean;
  payload?: Array<{ payload: CategorySlice }>;
  fmt: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]!.payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        {slice.icon} {slice.name}
      </p>
      <p className="font-mono text-muted-foreground">{fmt(slice.value)}</p>
    </div>
  );
}

export function SpendingByCategoryChart({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  const fmt = (n: number) => new Intl.NumberFormat('es-SV', { style: 'currency', currency }).format(n);

  if (slices.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aún no hay gastos este período para graficar.
      </p>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip fmt={fmt} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slices
          .slice()
          .sort((a, b) => b.value - a.value)
          .map((slice) => (
            <div key={slice.id} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden="true"
              />
              <span className="truncate text-muted-foreground">{slice.name}</span>
              <span className="ml-auto shrink-0 font-mono">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
