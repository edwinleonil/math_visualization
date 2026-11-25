import { useState } from 'react';
import { Contours } from '../../components/Contours';
import { LessonLayout } from '../../components/LessonLayout';
import { DataPath, Dot, Plot } from '../../components/Plot';
import { Button, Controls, Segmented, Slider, Stat, Stats, Tex, fmt, useAnimationLoop } from '../../components/ui';
import type { Fn2 } from '../../lib/math/calculus';
import { initState, rosenbrock, step, type OptState, type OptimizerId } from '../../lib/math/optimizers';

interface Landscape {
  id: string;
  label: string;
  f: Fn2;
  x: [number, number];
  y: [number, number];
  start: [number, number];
  min: [number, number];
  lr: Record<OptimizerId, number>;
}

const LANDSCAPES: Landscape[] = [
  {
    id: 'ravine',
    label: 'Narrow ravine',
    f: (x, y) => 0.02 * x * x + 4 * y * y,
    x: [-5, 5],
    y: [-2.5, 2.5],
    start: [-4.5, 1.8],
    min: [0, 0],
    lr: { gd: 0.23, momentum: 0.03, adam: 0.15 },
  },
  {
    id: 'rosenbrock',
    label: 'Rosenbrock banana',
    f: rosenbrock,
    x: [-2, 2],
    y: [-1, 3],
    start: [-1.5, 2.5],
    min: [1, 1],
    lr: { gd: 0.001, momentum: 0.0005, adam: 0.05 },
  },
];

const OPTS: { id: OptimizerId; label: string; color: string }[] = [
  { id: 'gd', label: 'Gradient descent', color: 'var(--c1)' },
  { id: 'momentum', label: 'Momentum', color: 'var(--c2)' },
  { id: 'adam', label: 'Adam', color: 'var(--c4)' },
];

type Paths = Record<OptimizerId, { state: OptState; path: [number, number][] }>;

const initPaths = (s: [number, number]): Paths => ({
  gd: { state: initState(...s), path: [s] },
  momentum: { state: initState(...s), path: [s] },
  adam: { state: initState(...s), path: [s] },
});

export default function Optimizers() {
  const [land, setLand] = useState(LANDSCAPES[0]);
  const [lr, setLr] = useState(land.lr);
  const [paths, setPaths] = useState<Paths>(() => initPaths(land.start));
  const [running, setRunning] = useState(false);
  const steps = paths.gd.path.length - 1;

  const doStep = () =>
    setPaths((p) => {
      const next = { ...p };
      for (const o of OPTS) {
        const cur = p[o.id];
        if (!Number.isFinite(cur.state.x) || Math.abs(cur.state.x) > 1e3) continue;
        const s = step(o.id, cur.state, lr[o.id], land.f);
        next[o.id] = { state: s, path: [...cur.path, [s.x, s.y]] };
      }
      return next;
    });

  useAnimationLoop(running && steps < 1000, doStep, 40);

  const choose = (id: string) => {
    const l = LANDSCAPES.find((x) => x.id === id)!;
    setLand(l);
    setLr(l.lr);
    setRunning(false);
    setPaths(initPaths(l.start));
  };
  const reset = (s: [number, number] = land.start) => {
    setRunning(false);
    setPaths(initPaths(s));
  };

  return (
    <LessonLayout
      title="Optimisers: momentum and Adam"
      intro={
        <p>
          Plain gradient descent struggles in long narrow valleys. It bounces between the steep walls while
          barely moving along the gentle floor. Modern optimisers fix this by remembering past gradients.
        </p>
      }
      explanation={
        <>
          <h3>Momentum</h3>
          <p>Momentum keeps a running velocity, like a ball rolling downhill:</p>
          <Tex block>{'v \\leftarrow \\beta v + \\nabla L,\\qquad \\theta \\leftarrow \\theta - \\eta v'}</Tex>
          <p>Oscillations across the valley cancel out, while consistent motion along it builds up speed.</p>
          <h3>Adam</h3>
          <p>
            Adam tracks both the average gradient <Tex>m</Tex> and the average <em>squared</em> gradient{' '}
            <Tex>v</Tex>, then divides by <Tex>{'\\sqrt v'}</Tex>. This gives every parameter its own adaptive
            step size:
          </p>
          <Tex block>{'\\theta \\leftarrow \\theta - \\eta\\,\\frac{\\hat m}{\\sqrt{\\hat v}+\\epsilon}'}</Tex>
          <p>Adam is the default optimiser for most deep-learning work.</p>
        </>
      }
      tryThis={[
        'On the narrow ravine, press Play. Compare how gradient descent (blue) moves along the valley floor with the other two.',
        'Gradient descent is already bouncing between the steep walls. Lower its η: the bouncing stops, but progress along the floor gets even slower. No single η suits both directions, which is the problem Adam solves.',
        'Switch to Rosenbrock. Its minimum at (1, 1) is famously hard to reach. Which optimiser gets there first?',
        'Click the plot to choose a different starting point.',
      ]}
    >
      <Segmented label="Landscape" value={land.id} onChange={choose} options={LANDSCAPES.map((l) => ({ value: l.id, label: l.label }))} />
      <Plot xDomain={land.x} yDomain={land.y} equalAspect={land.id === 'ravine'} height={420} onBackgroundClick={(p) => reset(p)}>
        <Contours f={land.f} transform={Math.log1p} levels={22} />
        <Dot x={land.min[0]} y={land.min[1]} r={5} color="var(--text)" />
        {OPTS.map((o) => (
          <g key={o.id}>
            <DataPath points={paths[o.id].path} color={o.color} width={2} />
            <Dot x={paths[o.id].state.x} y={paths[o.id].state.y} r={5} color={o.color} />
          </g>
        ))}
      </Plot>
      <Stats>
        <Stat label="Step" value={steps} />
        {OPTS.map((o) => (
          <Stat key={o.id} label={`${o.label} loss`} value={fmt(land.f(paths[o.id].state.x, paths[o.id].state.y))} color={o.color} />
        ))}
      </Stats>
      <Controls>
        {OPTS.map((o) => (
          <Slider
            key={o.id}
            label={<span style={{ color: o.color }}>η {o.label}</span>}
            value={lr[o.id]}
            min={land.lr[o.id] / 10}
            max={land.lr[o.id] * 4}
            step={land.lr[o.id] / 100}
            onChange={(v) => setLr((l) => ({ ...l, [o.id]: v }))}
            format={(v) => v.toPrecision(2)}
          />
        ))}
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
