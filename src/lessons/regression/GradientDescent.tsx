import { lazy, Suspense, useMemo, useState } from 'react';
import { Contours } from '../../components/Contours';
import { LessonLayout } from '../../components/LessonLayout';
import { Arrow, DataPath, Dot, DragPoint, FnPath, Plot } from '../../components/Plot';
import {
  Button,
  Controls,
  Segmented,
  Slider,
  Stat,
  Stats,
  Tex,
  fmt,
  useAnimationLoop,
} from '../../components/ui';
import { leastSquares, mse, mseGrad, predict } from '../../lib/math/regression';
import { B_DOMAIN, DEFAULT_POINTS, W_DOMAIN, lossFn } from './data';

const Surface3D = lazy(() => import('../../components/Surface3D'));

const START: [number, number] = [-1.5, 3.5];
const MAX_STEPS = 500;

export default function GradientDescent() {
  const points = DEFAULT_POINTS;
  const f = useMemo(() => lossFn(points), [points]);
  const best = leastSquares(points);
  const [lr, setLr] = useState(0.05);
  const [path, setPath] = useState<[number, number][]>([START]);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<'2d' | '3d'>('2d');

  const [w, b] = path[path.length - 1];
  const [gw, gb] = mseGrad(points, w, b);
  const loss = mse(points, w, b);
  const diverged = !Number.isFinite(loss) || Math.abs(w) > 1e3 || Math.abs(b) > 1e3;
  const converged = Math.hypot(gw, gb) < 1e-4;

  const doStep = () =>
    setPath((p) => {
      const [cw, cb] = p[p.length - 1];
      const [dw, db] = mseGrad(points, cw, cb);
      return [...p, [cw - lr * dw, cb - lr * db]];
    });

  useAnimationLoop(running && !diverged && !converged && path.length < MAX_STEPS, doStep, 20);

  const reset = (start: [number, number] = path[0]) => {
    setRunning(false);
    setPath([start]);
  };

  const losses = path.map(([pw, pb], i) => [i, mse(points, pw, pb)] as [number, number]);
  const maxLoss = Math.max(...losses.map((l) => (Number.isFinite(l[1]) ? l[1] : 0)), 1);

  return (
    <LessonLayout
      title="Gradient descent"
      intro={
        <p>
          The <strong>gradient</strong> <Tex>{'\\nabla L'}</Tex> points uphill, in the direction where the loss
          grows fastest. Gradient descent repeatedly takes a small step the opposite way, walking downhill
          until it reaches the bottom of the bowl.
        </p>
      }
      explanation={
        <>
          <h3>The update rule</h3>
          <Tex block>{'\\begin{aligned}w &\\leftarrow w-\\eta\\,\\frac{\\partial L}{\\partial w}\\\\ b &\\leftarrow b-\\eta\\,\\frac{\\partial L}{\\partial b}\\end{aligned}'}</Tex>
          <p>For MSE, the partial derivatives are:</p>
          <Tex block>{'\\frac{\\partial L}{\\partial w}=\\frac2n\\sum_i(\\hat y_i-y_i)x_i,\\quad\\frac{\\partial L}{\\partial b}=\\frac2n\\sum_i(\\hat y_i-y_i)'}</Tex>
          <h3>The learning rate η</h3>
          <p>
            The step size is <Tex>{'\\eta'}</Tex> (eta). If it is too small, training crawls. If it is too
            large, each step overshoots the valley and the loss can <em>explode</em>. Finding a good learning
            rate is one of the most important practical skills in ML.
          </p>
        </>
      }
      tryThis={[
        'Press Play with η = 0.05: the path drops quickly into the valley, then creeps along its floor (about 110 steps).',
        'Set η = 0.15: it zig-zags across the valley but converges in about 30 steps.',
        'Set η = 0.2 and Play: every step overshoots by more than the last, and the loss explodes. For this data, anything above η ≈ 0.18 diverges.',
        'Set η = 0.005: it is stable but very slow, and has not converged even after 500 steps.',
        'Click anywhere on the contour plot to choose a new starting point.',
      ]}
    >
      <div className="two-up">
        <div>
          <h4 className="fig-title">Parameter space: path of (w, b)</h4>
          {view === '2d' ? (
            <Plot
              xDomain={W_DOMAIN}
              yDomain={B_DOMAIN}
              xLabel="w"
              yLabel="b"
              height={380}
              onBackgroundClick={(pt) => reset(pt)}
            >
              <Contours f={f} transform={Math.log1p} levels={20} />
              <Dot x={best.w} y={best.b} r={5} color="var(--text)" />
              <DataPath points={path} color="var(--c2)" width={2} />
              {path.map(([pw, pb], i) => (
                <Dot key={i} x={pw} y={pb} r={2.5} color="var(--c2)" />
              ))}
              {!diverged && (
                <Arrow from={[w, b]} to={[w - 0.15 * gw, b - 0.15 * gb]} color="var(--c4)" width={2} />
              )}
              <DragPoint x={w} y={b} color="var(--c2)" onChange={(pw, pb) => reset([pw, pb])} />
            </Plot>
          ) : (
            <Suspense fallback={<div className="surface3d loading">Loading 3D…</div>}>
              <Surface3D f={f} xDomain={W_DOMAIN} yDomain={B_DOMAIN} path={path} marker={[w, b]} transform={Math.log1p} />
            </Suspense>
          )}
          <Segmented
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: '2d', label: 'Contour (2D)' },
              { value: '3d', label: 'Surface (3D)' },
            ]}
          />
        </div>
        <div>
          <h4 className="fig-title">Data space: the current line</h4>
          <Plot xDomain={[-5, 5]} yDomain={[-5, 8]} xLabel="x" yLabel="y" height={220}>
            {points.map((p, i) => (
              <Dot key={i} x={p.x} y={p.y} color="var(--c3)" />
            ))}
            <FnPath f={(x) => predict(w, b, x)} color="var(--c2)" />
          </Plot>
          <h4 className="fig-title">Loss vs iteration</h4>
          <Plot xDomain={[0, Math.max(20, path.length)]} yDomain={[0, maxLoss * 1.05]} xLabel="step" yLabel="L" height={170}>
            <DataPath points={losses.filter((l) => Number.isFinite(l[1]))} color="var(--c1)" />
          </Plot>
        </div>
      </div>
      <Stats>
        <Stat label="Step" value={path.length - 1} />
        <Stat label="Loss" value={fmt(loss)} color="var(--c2)" />
        <Stat label={<Tex>{'\\|\\nabla L\\|'}</Tex>} value={fmt(Math.hypot(gw, gb))} />
        <Stat
          label="Status"
          value={diverged ? 'Diverged' : converged ? 'Converged' : running ? 'Running' : 'Paused'}
          color={diverged ? 'var(--danger)' : converged ? 'var(--ok)' : undefined}
        />
      </Stats>
      <Controls>
        <Slider
          label={<Tex>{'\\eta'}</Tex>}
          value={lr}
          min={0.001}
          max={0.25}
          step={0.001}
          onChange={setLr}
          format={(v) => v.toFixed(3)}
        />
        <div className="btn-row">
          <Button primary onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Play'}
          </Button>
          <Button onClick={doStep}>Step</Button>
          <Button onClick={() => reset()}>Reset</Button>
        </div>
      </Controls>
    </LessonLayout>
  );
}
