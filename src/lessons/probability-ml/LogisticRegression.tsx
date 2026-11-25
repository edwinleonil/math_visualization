import { useMemo, useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { DataPath, Dot, DragPoint, FnPath, Plot, Segment, usePlot } from '../../components/Plot';
import { Button, Controls, Slider, Stat, Stats, Tex, fmt, useAnimationLoop } from '../../components/ui';
import { bce, sigmoid } from '../../lib/math/prob';
import { mulberry32, randn } from '../../lib/math/rng';

interface Sample {
  x: number;
  y: number;
  label: 0 | 1;
}

function makeData(seed: number, sep: number): Sample[] {
  const rand = mulberry32(seed);
  const out: Sample[] = [];
  for (let i = 0; i < 40; i++) {
    const label = (i % 2) as 0 | 1;
    const c = label ? sep : -sep;
    out.push({ x: c + 1.1 * randn(rand), y: c * 0.6 + 1.1 * randn(rand), label });
  }
  return out;
}

type Params = { w1: number; w2: number; b: number };

const prob = (p: Params, x: number, y: number) => sigmoid(p.w1 * x + p.w2 * y + p.b);

function loss(data: Sample[], p: Params) {
  return data.reduce((s, d) => s + bce(d.label, prob(p, d.x, d.y)), 0) / data.length;
}

function grad(data: Sample[], p: Params): Params {
  let g1 = 0;
  let g2 = 0;
  let gb = 0;
  for (const d of data) {
    const e = prob(p, d.x, d.y) - d.label; // the derivative of BCE∘σ is simply (p − y)
    g1 += e * d.x;
    g2 += e * d.y;
    gb += e;
  }
  const n = data.length;
  return { w1: g1 / n, w2: g2 / n, b: gb / n };
}

const INIT: Params = { w1: -0.5, w2: 1, b: 0.5 };

export default function LogisticRegression() {
  const [sep, setSep] = useState(1.3);
  const [seed] = useState(3);
  const [data, setData] = useState(() => makeData(seed, sep));
  const [p, setP] = useState<Params>(INIT);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const L = loss(data, p);
  const acc = data.filter((d) => (prob(p, d.x, d.y) >= 0.5 ? 1 : 0) === d.label).length / data.length;

  const doStep = () => {
    setP((cur) => {
      const g = grad(data, cur);
      const lr = 0.5;
      return { w1: cur.w1 - lr * g.w1, w2: cur.w2 - lr * g.w2, b: cur.b - lr * g.b };
    });
    setHistory((h) => [...h, L]);
  };
  useAnimationLoop(running && history.length < 400, doStep, 30);

  const reset = () => {
    setRunning(false);
    setP(INIT);
    setHistory([]);
  };

  // Decision boundary: w1 x + w2 y + b = 0
  const boundary = (x: number) => (Math.abs(p.w2) < 1e-6 ? NaN : -(p.w1 * x + p.b) / p.w2);
  const z = (d: Sample) => p.w1 * d.x + p.w2 * d.y + p.b;

  return (
    <LessonLayout
      title="Logistic regression"
      intro={
        <p>
          Classification asks &ldquo;which class?&rdquo; rather than &ldquo;how much?&rdquo;. Logistic regression
          computes a linear score <Tex>{'z=\\mathbf w\\cdot\\mathbf x+b'}</Tex>, then squashes it through the{' '}
          <strong>sigmoid</strong> to get a probability between 0 and 1. It is a single neuron.
        </p>
      }
      explanation={
        <>
          <h3>The sigmoid</h3>
          <Tex block>{'\\sigma(z)=\\frac{1}{1+e^{-z}}'}</Tex>
          <Tex block>{'P(y=1\\mid\\mathbf x)=\\sigma(\\mathbf w\\cdot\\mathbf x+b)'}</Tex>
          <p>
            The <strong>decision boundary</strong> is where <Tex>{'\\sigma(z)=0.5'}</Tex>, which means{' '}
            <Tex>{'z=0'}</Tex>. That is a straight line.
          </p>
          <h3>Cross-entropy loss</h3>
          <Tex block>{'\\begin{aligned}L=-\\frac1n\\sum_i\\big[&y_i\\log p_i\\\\ &+(1-y_i)\\log(1-p_i)\\big]\\end{aligned}'}</Tex>
          <p>
            A confident wrong answer (<Tex>{'p\\to0'}</Tex> when <Tex>{'y=1'}</Tex>) is punished severely,
            because <Tex>{'-\\log p\\to\\infty'}</Tex>.
          </p>
          <h3>A neat gradient</h3>
          <Tex block>{'\\frac{\\partial L}{\\partial \\mathbf w}=\\frac1n\\sum_i (p_i-y_i)\\,\\mathbf x_i'}</Tex>
          <p>
            This has the same form as linear regression&rsquo;s gradient: the prediction error times the input.
          </p>
        </>
      }
      tryThis={[
        'Press Train and watch the boundary rotate into place and the background sharpen.',
        'Drag a blue point deep into orange territory. The loss jumps, because a confident mistake costs a lot.',
        'Reduce the class separation so the classes overlap. Can any straight line reach 100% accuracy now?',
      ]}
    >
      <div className="two-up">
        <div>
          <h4 className="fig-title">Feature space with P(class 1)</h4>
          <Plot xDomain={[-5, 5]} yDomain={[-5, 5]} equalAspect xLabel="x₁" yLabel="x₂">
            <ProbField p={p} />
            <FnPath f={boundary} color="var(--text)" width={2} />
            {data.map((d, i) => (
              <DragPoint
                key={i}
                x={d.x}
                y={d.y}
                r={5}
                color={d.label ? 'var(--c2)' : 'var(--c1)'}
                onChange={(x, y) => setData((ds) => ds.map((q, j) => (j === i ? { ...q, x, y } : q)))}
              />
            ))}
          </Plot>
        </div>
        <div>
          <h4 className="fig-title">Each point&rsquo;s score z through σ</h4>
          <Plot xDomain={[-8, 8]} yDomain={[-0.05, 1.05]} height={230} xLabel="z" yLabel="σ(z)">
            <Segment a={[-8, 0.5]} b={[8, 0.5]} color="var(--muted)" dashed />
            <FnPath f={sigmoid} color="var(--text)" />
            {data.map((d, i) => (
              <Dot key={i} x={Math.max(-8, Math.min(8, z(d)))} y={d.label} r={4} opacity={0.7} color={d.label ? 'var(--c2)' : 'var(--c1)'} />
            ))}
          </Plot>
          <h4 className="fig-title">Training loss</h4>
          <Plot xDomain={[0, Math.max(30, history.length)]} yDomain={[0, Math.max(1, ...history)]} height={150} xLabel="step">
            <DataPath points={history.map((h, i) => [i, h])} color="var(--c4)" />
          </Plot>
        </div>
      </div>
      <Stats>
        <Stat label="Cross-entropy" value={fmt(L, 3)} color="var(--c4)" />
        <Stat label="Accuracy" value={`${fmt(acc * 100, 0)}%`} />
        <Stat label="w" value={`(${fmt(p.w1, 2)}, ${fmt(p.w2, 2)})`} />
        <Stat label="b" value={fmt(p.b, 2)} />
      </Stats>
      <Controls>
        <Slider
          label="Separation"
          value={sep}
          min={0.2}
          max={2.5}
          onChange={(v) => {
            setSep(v);
            setData(makeData(seed, v));
            setHistory([]);
          }}
        />
        <div className="btn-row">
          <Button primary onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Train'}
          </Button>
          <Button onClick={doStep}>Step</Button>
          <Button onClick={reset}>Reset weights</Button>
        </div>
      </Controls>
    </LessonLayout>
  );
}

/** Coarse probability heat-map behind the points: blue → white → orange. */
function ProbField({ p }: { p: Params }) {
  const { x, y } = usePlot();
  const cells = useMemo(() => {
    const out: { x0: number; y0: number; v: number }[] = [];
    const n = 30;
    const s = 10 / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const cx = -5 + (i + 0.5) * s;
        const cy = -5 + (j + 0.5) * s;
        out.push({ x0: -5 + i * s, y0: -5 + (j + 1) * s, v: prob(p, cx, cy) });
      }
    return { out, s };
  }, [p]);
  const w = x(cells.s) - x(0);
  const h = y(0) - y(cells.s);
  return (
    <g>
      {cells.out.map((c, k) => (
        <rect
          key={k}
          x={x(c.x0)}
          y={y(c.y0)}
          width={w + 0.5}
          height={h + 0.5}
          fill={c.v >= 0.5 ? 'var(--c2)' : 'var(--c1)'}
          fillOpacity={Math.abs(c.v - 0.5) * 0.5}
        />
      ))}
    </g>
  );
}
