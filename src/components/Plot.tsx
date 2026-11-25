import { scaleLinear, type ScaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';

interface PlotCtx {
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
  /** Convert a pointer event to data coordinates. */
  toData: (e: { clientX: number; clientY: number }) => [number, number];
  markerId: string;
}

const Ctx = createContext<PlotCtx | null>(null);

export function usePlot(): PlotCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlot must be used inside <Plot>');
  return c;
}

interface PlotProps {
  xDomain: [number, number];
  yDomain: [number, number];
  width?: number;
  height?: number;
  /** Keep one unit in x the same on-screen length as one unit in y (overrides height). */
  equalAspect?: boolean;
  grid?: boolean;
  xLabel?: string;
  yLabel?: string;
  onBackgroundClick?: (pt: [number, number]) => void;
  children?: ReactNode;
  ariaLabel?: string;
}

const M = { top: 12, right: 14, bottom: 30, left: 38 };

/** Responsive SVG coordinate plane. Children read the scales through `usePlot()`. */
export function Plot({
  xDomain,
  yDomain,
  width = 560,
  height = 400,
  equalAspect,
  grid = true,
  xLabel,
  yLabel,
  onBackgroundClick,
  children,
  ariaLabel,
}: PlotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markerId = useId().replace(/:/g, '');
  const innerW = width - M.left - M.right;
  const innerH = equalAspect
    ? (innerW * (yDomain[1] - yDomain[0])) / (xDomain[1] - xDomain[0])
    : height - M.top - M.bottom;
  const H = innerH + M.top + M.bottom;

  const x = useMemo(() => scaleLinear().domain(xDomain).range([M.left, M.left + innerW]), [xDomain, innerW]);
  const y = useMemo(() => scaleLinear().domain(yDomain).range([M.top + innerH, M.top]), [yDomain, innerH]);

  const toData = useCallback(
    (e: { clientX: number; clientY: number }): [number, number] => {
      const svg = svgRef.current;
      if (!svg) return [0, 0];
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return [0, 0];
      const p = pt.matrixTransform(ctm.inverse());
      return [x.invert(p.x), y.invert(p.y)];
    },
    [x, y],
  );

  const ctx = useMemo(() => ({ x, y, toData, markerId }), [x, y, toData, markerId]);
  const xTicks = x.ticks(innerW > 400 ? 10 : 6);
  const yTicks = y.ticks(innerH > 300 ? 8 : 5);
  const x0 = Math.min(Math.max(0, xDomain[0]), xDomain[1]);
  const y0 = Math.min(Math.max(0, yDomain[0]), yDomain[1]);
  const clipId = `clip-${markerId}`;

  return (
    <svg
      ref={svgRef}
      className="plot"
      viewBox={`0 0 ${width} ${H}`}
      role="img"
      aria-label={ariaLabel}
      onPointerDown={
        onBackgroundClick
          ? (e: ReactPointerEvent<SVGSVGElement>) => onBackgroundClick(toData(e)) // DragPoint stops propagation
          : undefined
      }
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={M.left} y={M.top} width={innerW} height={innerH} />
        </clipPath>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      <rect className="plot-bg" x={M.left} y={M.top} width={innerW} height={innerH} />
      {grid && (
        <g className="plot-grid">
          {xTicks.map((t) => (
            <line key={`x${t}`} x1={x(t)} x2={x(t)} y1={M.top} y2={M.top + innerH} />
          ))}
          {yTicks.map((t) => (
            <line key={`y${t}`} y1={y(t)} y2={y(t)} x1={M.left} x2={M.left + innerW} />
          ))}
        </g>
      )}
      <g className="plot-axis">
        <line x1={M.left} x2={M.left + innerW} y1={y(y0)} y2={y(y0)} />
        <line y1={M.top} y2={M.top + innerH} x1={x(x0)} x2={x(x0)} />
        {xTicks.map((t) => (
          <text key={`xt${t}`} x={x(t)} y={M.top + innerH + 16} textAnchor="middle">
            {fmtTick(t)}
          </text>
        ))}
        {yTicks.map((t) => (
          <text key={`yt${t}`} x={M.left - 6} y={y(t) + 4} textAnchor="end">
            {fmtTick(t)}
          </text>
        ))}
        {xLabel && (
          <text className="plot-label" x={M.left + innerW} y={M.top + innerH - 6} textAnchor="end">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text className="plot-label" x={M.left + 6} y={M.top + 14}>
            {yLabel}
          </text>
        )}
      </g>
      <Ctx.Provider value={ctx}>
        <g clipPath={`url(#${clipId})`}>{children}</g>
      </Ctx.Provider>
    </svg>
  );
}

const fmtTick = (t: number) => (Math.abs(t) >= 1000 || (Math.abs(t) < 0.01 && t !== 0) ? t.toExponential(0) : String(+t.toFixed(2)));

/** Plot y = f(x) across the visible x-domain. */
export function FnPath({
  f,
  color = 'var(--c1)',
  width = 2.5,
  dashed,
  samples = 300,
}: {
  f: (x: number) => number;
  color?: string;
  width?: number;
  dashed?: boolean;
  samples?: number;
}) {
  const { x, y } = usePlot();
  const [a, b] = x.domain();
  const [ylo, yhi] = y.domain();
  const span = yhi - ylo;
  const pts: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const xv = a + ((b - a) * i) / samples;
    const yv = f(xv);
    pts.push([xv, Number.isFinite(yv) ? Math.max(ylo - span, Math.min(yhi + span, yv)) : NaN]);
  }
  const d = line<[number, number]>()
    .defined((p) => !Number.isNaN(p[1]))
    .x((p) => x(p[0]))
    .y((p) => y(p[1]))(pts);
  return (
    <path d={d ?? ''} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? '6 5' : undefined} />
  );
}

/** Polyline through data points. */
export function DataPath({ points, color = 'var(--c1)', width = 2 }: { points: [number, number][]; color?: string; width?: number }) {
  const { x, y } = usePlot();
  const d = line<[number, number]>()
    .x((p) => x(p[0]))
    .y((p) => y(p[1]))(points);
  return <path d={d ?? ''} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" />;
}

/** Arrow from `from` to `to` in data coordinates. */
export function Arrow({
  from = [0, 0],
  to,
  color = 'var(--c1)',
  width = 3,
  label,
  dashed,
}: {
  from?: [number, number];
  to: [number, number];
  color?: string;
  width?: number;
  label?: ReactNode;
  dashed?: boolean;
}) {
  const { x, y, markerId } = usePlot();
  const len = Math.hypot(x(to[0]) - x(from[0]), y(to[1]) - y(from[1]));
  return (
    <g>
      <line
        x1={x(from[0])}
        y1={y(from[1])}
        x2={x(to[0])}
        y2={y(to[1])}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '5 4' : undefined}
        markerEnd={len > 4 ? `url(#${markerId})` : undefined}
      />
      {label && (
        <text className="plot-annot" x={x(to[0]) + 8} y={y(to[1]) - 8} fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

/** A point the user can drag. Optional `snap` rounds to a grid step. */
export function DragPoint({
  x: px,
  y: py,
  onChange,
  color = 'var(--c1)',
  r = 8,
  snap,
  label,
}: {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  color?: string;
  r?: number;
  snap?: number;
  label?: string;
}) {
  const { x, y, toData } = usePlot();
  const dragging = useRef(false);
  const round = (v: number) => (snap ? Math.round(v / snap) * snap : v);
  return (
    <g
      className="drag-point"
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const [dx, dy] = toData(e);
        onChange(round(dx), round(dy));
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <circle cx={x(px)} cy={y(py)} r={r + 10} fill="transparent" />
      <circle cx={x(px)} cy={y(py)} r={r} fill={color} stroke="var(--surface)" strokeWidth={2} />
      {label && (
        <text className="plot-annot" x={x(px) + r + 4} y={y(py) - r} fill={color}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Dot({ x: px, y: py, color = 'var(--c1)', r = 4, opacity = 1 }: { x: number; y: number; color?: string; r?: number; opacity?: number }) {
  const { x, y } = usePlot();
  return <circle cx={x(px)} cy={y(py)} r={r} fill={color} opacity={opacity} />;
}

export function Segment({
  a,
  b,
  color = 'var(--muted)',
  width = 1.5,
  dashed,
}: {
  a: [number, number];
  b: [number, number];
  color?: string;
  width?: number;
  dashed?: boolean;
}) {
  const { x, y } = usePlot();
  return (
    <line
      x1={x(a[0])}
      y1={y(a[1])}
      x2={x(b[0])}
      y2={y(b[1])}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  );
}

/** Filled polygon in data coordinates. */
export function Polygon({ points, fill, opacity = 0.25, stroke }: { points: [number, number][]; fill: string; opacity?: number; stroke?: string }) {
  const { x, y } = usePlot();
  return (
    <polygon
      points={points.map((p) => `${x(p[0])},${y(p[1])}`).join(' ')}
      fill={fill}
      fillOpacity={opacity}
      stroke={stroke}
      strokeWidth={stroke ? 1.5 : 0}
    />
  );
}
