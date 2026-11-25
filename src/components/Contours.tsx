import { contours } from 'd3-contour';
import { scaleLinear } from 'd3-scale';
import { useMemo } from 'react';
import { sampleGrid, type Fn2 } from '../lib/math/calculus';
import { usePlot } from './Plot';

const RAMP_LIGHT = ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81'];

/**
 * Filled contour map of f over the plot's current domain.
 * `transform` (e.g. Math.log1p) spaces the levels better for steep surfaces.
 */
export function Contours({
  f,
  levels = 18,
  resolution = 90,
  transform = (v: number) => v,
  lines = true,
}: {
  f: Fn2;
  levels?: number;
  resolution?: number;
  transform?: (v: number) => number;
  lines?: boolean;
}) {
  const { x, y } = usePlot();
  const xd = x.domain() as [number, number];
  const yd = y.domain() as [number, number];
  const nx = resolution;
  const ny = Math.max(10, Math.round((resolution * (y.range()[0] - y.range()[1])) / (x.range()[1] - x.range()[0])));

  const { paths, color } = useMemo(() => {
    const values = sampleGrid(f, xd, yd, nx, ny).map(transform);
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of values) {
      if (Number.isFinite(v)) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
    const thresholds = Array.from({ length: levels }, (_, i) => lo + ((hi - lo) * (i + 0.5)) / levels);
    const paths = contours().size([nx, ny]).thresholds(thresholds)(values);
    const color = scaleLinear<string>()
      .domain(RAMP_LIGHT.map((_, i) => lo + ((hi - lo) * i) / (RAMP_LIGHT.length - 1)))
      .range(RAMP_LIGHT);
    return { paths, color };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, xd[0], xd[1], yd[0], yd[1], nx, ny, levels, transform]);

  // Map grid coordinates (0..nx-1, 0..ny-1) to SVG pixels.
  const gx = (i: number) => x(xd[0] + ((xd[1] - xd[0]) * i) / (nx - 1));
  const gy = (j: number) => y(yd[0] + ((yd[1] - yd[0]) * j) / (ny - 1));
  const toPath = (coords: number[][][][]) =>
    coords
      .map((poly) => poly.map((ring) => 'M' + ring.map(([i, j]) => `${gx(i)},${gy(j)}`).join('L') + 'Z').join(''))
      .join('');

  return (
    <g className="contours">
      {paths.map((p, k) => (
        <path
          key={k}
          d={toPath(p.coordinates)}
          fill={color(p.value)}
          fillOpacity={0.55}
          stroke={lines ? 'var(--contour-line)' : 'none'}
          strokeWidth={0.6}
        />
      ))}
    </g>
  );
}
