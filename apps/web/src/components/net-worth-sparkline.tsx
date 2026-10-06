interface Point {
  date: string;
  value: number;
}

/** Mini-tendencia de patrimonio neto — SVG estático, sin dependencias nuevas. */
export function NetWorthSparkline({ points }: { points: Point[] }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 220;
    const y = 32 - ((p.value - min) / range) * 28;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trendingUp = values[values.length - 1]! >= values[0]!;

  return (
    <svg viewBox="0 0 220 40" className="mt-3 h-9 w-full" aria-hidden="true">
      <polyline
        points={coords.join(' ')}
        fill="none"
        strokeWidth={2}
        className={trendingUp ? 'stroke-ff-green/60' : 'stroke-ff-red/60'}
      />
    </svg>
  );
}
