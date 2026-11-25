import { lazy, Suspense, useMemo, useState } from 'react';
import { Contours } from '../../components/Contours';
import { LessonLayout } from '../../components/LessonLayout';
import { Dot, DragPoint, FnPath, Plot } from '../../components/Plot';
import { Segmented, Stat, Stats, Tex, fmt } from '../../components/ui';
import { leastSquares, mse, predict } from '../../lib/math/regression';
import { B_DOMAIN, DEFAULT_POINTS, W_DOMAIN, lossFn } from './data';

const Surface3D = lazy(() => import('../../components/Surface3D'));

export default function LossSurface() {
  const [w, setW] = useState(-1);
  const [b, setB] = useState(3);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const points = DEFAULT_POINTS;
  const f = useMemo(() => lossFn(points), [points]);
  const best = leastSquares(points);

  return (
    <LessonLayout
      title="The loss surface"
      intro={
        <p>
          Every possible line, that is every pair <Tex>{'(w, b)'}</Tex>, has a loss value. Plotting the loss
          for all pairs gives a <em>loss surface</em>. Training a model means finding the lowest point on that
          surface.
        </p>
      }
      explanation={
        <>
          <h3>Parameter space vs data space</h3>
          <p>
            The left plot is <strong>data space</strong>, with axes <Tex>x</Tex> and <Tex>y</Tex>. The right plot
            is <strong>parameter space</strong>, with axes <Tex>w</Tex> and <Tex>b</Tex>. A single point on the
            right is a whole line on the left.
          </p>
          <Tex block>{'L(w,b)=\\frac1n\\sum_i (wx_i+b-y_i)^2'}</Tex>
          <p>
            For linear regression <Tex>L</Tex> is a quadratic in <Tex>w</Tex> and <Tex>b</Tex>, so the surface
            is a smooth <strong>convex bowl</strong> with a single minimum and no local traps. Its contours are
            ellipses. Neural-network loss surfaces are far bumpier.
          </p>
        </>
      }
      tryThis={[
        'Drag the orange point in parameter space and watch the line on the left move.',
        'Move along one contour line: every line on it has the same MSE.',
        'Switch to 3D and rotate the bowl. The ellipses become stretched because x and the intercept affect the loss at different scales.',
      ]}
    >
      <div className="two-up">
        <div>
          <h4 className="fig-title">Data space</h4>
          <Plot xDomain={[-5, 5]} yDomain={[-5, 8]} xLabel="x" yLabel="y" height={380}>
            {points.map((p, i) => (
              <Dot key={i} x={p.x} y={p.y} color="var(--c3)" />
            ))}
            <FnPath f={(x) => predict(w, b, x)} color="var(--c2)" />
          </Plot>
        </div>
        <div>
          <h4 className="fig-title">Parameter space: L(w, b)</h4>
          {view === '2d' ? (
            <Plot
              xDomain={W_DOMAIN}
              yDomain={B_DOMAIN}
              xLabel="w"
              yLabel="b"
              height={380}
              onBackgroundClick={([pw, pb]) => {
                setW(pw);
                setB(pb);
              }}
            >
              <Contours f={f} transform={Math.log1p} levels={20} />
              <Dot x={best.w} y={best.b} r={5} color="var(--text)" />
              <DragPoint
                x={w}
                y={b}
                color="var(--c2)"
                onChange={(pw, pb) => {
                  setW(pw);
                  setB(pb);
                }}
              />
            </Plot>
          ) : (
            <Suspense fallback={<div className="surface3d loading">Loading 3D…</div>}>
              <Surface3D f={f} xDomain={W_DOMAIN} yDomain={B_DOMAIN} marker={[w, b]} transform={Math.log1p} />
            </Suspense>
          )}
        </div>
      </div>
      <Stats>
        <Stat label={<Tex>w</Tex>} value={fmt(w, 2)} />
        <Stat label={<Tex>b</Tex>} value={fmt(b, 2)} />
        <Stat label="L(w, b)" value={fmt(mse(points, w, b))} color="var(--c2)" />
        <Stat label="Minimum" value={fmt(mse(points, best.w, best.b))} />
      </Stats>
      <Segmented
        label="View"
        value={view}
        onChange={setView}
        options={[
          { value: '2d', label: 'Contour (2D)' },
          { value: '3d', label: 'Surface (3D)' },
        ]}
      />
      <p className="hint">Contour colours use log(1 + L) so the levels near the minimum stay visible.</p>
    </LessonLayout>
  );
}
