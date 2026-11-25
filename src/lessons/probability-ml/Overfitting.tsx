import { useMemo, useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { DataPath, Dot, FnPath, Plot, Segment } from '../../components/Plot';
import { Button, Controls, Slider, Stat, Stats, Tex, Toggle, fmt } from '../../components/ui';
import { polyEval, polyFit, type Point } from '../../lib/math/regression';
import { mulberry32, randn } from '../../lib/math/rng';

const truth = (x: number) => Math.sin(Math.PI * x);
const MAX_DEG = 15;

function sample(n: number, seed: number, noise: number): Point[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const x = rand() * 2 - 1;
    return { x, y: truth(x) + noise * randn(rand) };
  });
}

const mseOf = (c: number[], pts: Point[]) => pts.reduce((s, p) => s + (polyEval(c, p.x) - p.y) ** 2, 0) / pts.length;

export default function Overfitting() {
  const [degree, setDegree] = useState(3);
  const [nTrain, setNTrain] = useState(12);
  const [logLambda, setLogLambda] = useState(-8);
  const [seed, setSeed] = useState(5);
  const [showTest, setShowTest] = useState(true);
  const noise = 0.25;
  const lambda = 10 ** logLambda;

  const train = useMemo(() => sample(nTrain, seed, noise), [nTrain, seed]);
  const test = useMemo(() => sample(200, 999, noise), []);
  const coef = polyFit(train, degree, Math.max(lambda * train.length, 1e-10));

  const curve = useMemo(
    () =>
      Array.from({ length: MAX_DEG + 1 }, (_, d) => {
        const c = polyFit(train, d, Math.max(lambda * train.length, 1e-10)); // sums, not means, so scale by n
        return { d, train: mseOf(c, train), test: mseOf(c, test) };
      }),
    [train, test, lambda],
  );
  const bestDeg = curve.reduce((b, c) => (c.test < b.test ? c : b)).d;
  const trainErr = curve[degree].train;
  const testErr = curve[degree].test;
  const log = (v: number) => Math.log10(Math.max(v, 1e-6));
  const ymax = Math.max(1, ...curve.map((c) => log(c.test))) + 0.2;
  const ymin = Math.min(...curve.map((c) => log(c.train)), -3);

  const verdict =
    degree < bestDeg - 1 && testErr > curve[bestDeg].test * 1.3
      ? { text: 'Underfitting', color: 'var(--c1)' }
      : degree > bestDeg + 1 && testErr > curve[bestDeg].test * 1.3
        ? { text: 'Overfitting', color: 'var(--danger)' }
        : { text: 'About right', color: 'var(--ok)' };

  return (
    <LessonLayout
      title="Overfitting and generalisation"
      intro={
        <p>
          A model is only useful if it works on data it has <em>never seen</em>. A model that is too simple
          misses the pattern (<strong>underfitting</strong>). A model that is too flexible memorises the
          noise in its training data (<strong>overfitting</strong>). Here we fit polynomials of increasing
          degree to noisy samples of <Tex>{'\\sin(\\pi x)'}</Tex>.
        </p>
      }
      explanation={
        <>
          <h3>Training vs test error</h3>
          <p>
            Training error always falls as the model grows more flexible. Test error falls at first, then{' '}
            <strong>rises again</strong> once the model starts fitting noise. That U-shape is the{' '}
            <em>bias–variance trade-off</em>.
          </p>
          <Tex block>{'\\mathbb E[\\text{test error}]=\\text{bias}^2+\\text{variance}+\\text{noise}'}</Tex>
          <h3>Regularisation</h3>
          <p>Ridge (L2) regression adds a penalty on large weights:</p>
          <Tex block>{'L(\\mathbf c)=\\frac1n\\sum_i\\big(\\hat y_i-y_i\\big)^2+\\lambda\\|\\mathbf c\\|^2'}</Tex>
          <p>
            This tames the wild wiggles of high-degree fits without reducing the degree. Weight decay in
            neural networks is the same idea.
          </p>
          <h3>More data helps</h3>
          <p>With more training points, a flexible model has less room to wiggle between them.</p>
        </>
      }
      tryThis={[
        'Slide the degree from 0 to 15. Watch the training error (blue) keep falling while the test error (orange) turns back up.',
        'At degree 12, increase λ. The curve calms down and the test error drops.',
        'At degree 12, increase the number of training points instead. That also fixes it.',
        'Press "New sample": high-degree fits change drastically between samples. That instability is variance.',
      ]}
    >
      <div className="two-up">
        <div>
          <h4 className="fig-title">Degree {degree} polynomial fit</h4>
          <Plot xDomain={[-1.05, 1.05]} yDomain={[-2, 2]} height={320} xLabel="x" yLabel="y">
            <FnPath f={truth} color="var(--muted)" dashed width={1.5} />
            {showTest && test.map((p, i) => <Dot key={`t${i}`} x={p.x} y={p.y} r={2.5} color="var(--c2)" opacity={0.35} />)}
            <FnPath f={(x) => polyEval(coef, x)} color="var(--c4)" width={2.5} samples={500} />
            {train.map((p, i) => (
              <Dot key={i} x={p.x} y={p.y} r={5} color="var(--c1)" />
            ))}
          </Plot>
        </div>
        <div>
          <h4 className="fig-title">Error vs degree (log₁₀ MSE)</h4>
          <Plot xDomain={[0, MAX_DEG]} yDomain={[ymin, ymax]} height={320} xLabel="degree">
            <Segment a={[degree, ymin]} b={[degree, ymax]} color="var(--c4)" dashed />
            <DataPath points={curve.map((c) => [c.d, log(c.train)])} color="var(--c1)" />
            <DataPath points={curve.map((c) => [c.d, log(c.test)])} color="var(--c2)" />
            {curve.map((c) => (
              <g key={c.d}>
                <Dot x={c.d} y={log(c.train)} r={3} color="var(--c1)" />
                <Dot x={c.d} y={log(c.test)} r={3} color="var(--c2)" />
              </g>
            ))}
          </Plot>
        </div>
      </div>
      <div className="legend">
        <span style={{ color: 'var(--c1)' }}>Training data / error</span>
        <span style={{ color: 'var(--c2)' }}>Test data / error</span>
        <span style={{ color: 'var(--c4)' }}>Model</span>
        <span style={{ color: 'var(--muted)' }}>True function</span>
      </div>
      <Stats>
        <Stat label="Train MSE" value={fmt(trainErr, 4)} color="var(--c1)" />
        <Stat label="Test MSE" value={fmt(testErr, 4)} color="var(--c2)" />
        <Stat label="Best degree (test)" value={bestDeg} />
        <Stat label="Diagnosis" value={verdict.text} color={verdict.color} />
      </Stats>
      <Controls>
        <Slider label="Degree" value={degree} min={0} max={MAX_DEG} step={1} onChange={setDegree} format={(v) => String(v)} />
        <Slider label="Train points" value={nTrain} min={5} max={60} step={1} onChange={setNTrain} format={(v) => String(v)} />
        <Slider
          label={<Tex>{'\\lambda'}</Tex>}
          value={logLambda}
          min={-8}
          max={0}
          step={0.1}
          onChange={setLogLambda}
          format={(v) => (v <= -8 ? '≈0' : `1e${v.toFixed(1)}`)}
        />
        <Toggle label="Show test points" checked={showTest} onChange={setShowTest} />
        <div className="btn-row">
          <Button onClick={() => setSeed((s) => s + 1)}>New sample</Button>
        </div>
      </Controls>
    </LessonLayout>
  );
}
