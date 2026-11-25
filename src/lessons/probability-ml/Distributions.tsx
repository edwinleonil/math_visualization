import { useMemo, useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { FnPath, Plot, Segment, usePlot } from '../../components/Plot';
import { Button, Controls, Segmented, Slider, Stat, Stats, Tex, fmt } from '../../components/ui';
import { histogram, normalPdf, uniformPdf } from '../../lib/math/prob';
import { mulberry32, randn } from '../../lib/math/rng';

type Dist = 'normal' | 'uniform' | 'bernoulli';
const LO = -6;
const HI = 6;
const BINS = 48;

export default function Distributions() {
  const [dist, setDist] = useState<Dist>('normal');
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [a, setA] = useState(-2);
  const [b, setB] = useState(2);
  const [p, setP] = useState(0.3);
  const [n, setN] = useState(0);
  const [seed, setSeed] = useState(1);

  const samples = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: n }, () => {
      if (dist === 'normal') return mu + sigma * randn(rand);
      if (dist === 'uniform') return a + (b - a) * rand();
      return rand() < p ? 1 : 0;
    });
  }, [n, seed, dist, mu, sigma, a, b, p]);

  const mean = n ? samples.reduce((s, v) => s + v, 0) / n : NaN;
  const variance = n ? samples.reduce((s, v) => s + (v - mean) ** 2, 0) / n : NaN;
  const trueMean = dist === 'normal' ? mu : dist === 'uniform' ? (a + b) / 2 : p;
  const trueVar = dist === 'normal' ? sigma ** 2 : dist === 'uniform' ? (b - a) ** 2 / 12 : p * (1 - p);

  const addSamples = (k: number) => setN((x) => Math.min(20000, x + k));
  const change = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setN(0);
  };

  const yMax = dist === 'normal' ? Math.max(0.5, normalPdf(mu, mu, sigma) * 1.15) : dist === 'uniform' ? Math.max(0.5, 1.2 / (b - a)) : 1.1;

  return (
    <LessonLayout
      title="Probability distributions"
      intro={
        <p>
          A probability distribution describes how likely each outcome is. ML models are full of them: noise
          in data, the initial weights, and a classifier&rsquo;s output are all distributions. Below, the
          smooth curve is the theory and the bars are what actually happens when you draw random samples.
        </p>
      }
      explanation={
        <>
          {dist === 'normal' && (
            <>
              <h3>Normal (Gaussian)</h3>
              <Tex block>{'p(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}\\,e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}'}</Tex>
              <p>
                The bell curve, with mean <Tex>{'\\mu'}</Tex> and standard deviation <Tex>{'\\sigma'}</Tex>. Least
                squares regression is exactly what you get if you assume the errors are Gaussian.
              </p>
            </>
          )}
          {dist === 'uniform' && (
            <>
              <h3>Uniform</h3>
              <Tex block>{'p(x)=\\begin{cases}\\frac{1}{b-a}&a\\le x\\le b\\\\0&\\text{otherwise}\\end{cases}'}</Tex>
              <p>Every value in the range is equally likely. It is often used to initialise weights.</p>
            </>
          )}
          {dist === 'bernoulli' && (
            <>
              <h3>Bernoulli</h3>
              <Tex block>{'P(X=1)=p,\\qquad P(X=0)=1-p'}</Tex>
              <p>
                This is a single yes/no event, such as a coin flip. A binary classifier outputs <Tex>p</Tex>,
                the parameter of a Bernoulli distribution.
              </p>
            </>
          )}
          <h3>Expectation and variance</h3>
          <Tex block>{'\\mathbb E[X]=\\mu,\\qquad \\operatorname{Var}[X]=\\mathbb E[(X-\\mu)^2]'}</Tex>
          <h3>Law of large numbers</h3>
          <p>
            As you draw more samples, the histogram approaches the true curve and the sample mean approaches{' '}
            <Tex>{'\\mathbb E[X]'}</Tex>. This is why training on more data gives more reliable models.
          </p>
        </>
      }
      tryThis={[
        'Draw 10 samples, then keep adding. When does the histogram start to look like the curve?',
        'Compare the sample mean with the true mean as n grows.',
        'Make σ small, then large. The area under the curve always stays 1.',
      ]}
    >
      <Segmented
        label="Distribution"
        value={dist}
        onChange={change(setDist)}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'uniform', label: 'Uniform' },
          { value: 'bernoulli', label: 'Bernoulli' },
        ]}
      />
      <Plot xDomain={dist === 'bernoulli' ? [-0.75, 1.75] : [LO, HI]} yDomain={[0, yMax]} height={340} xLabel="x" yLabel={dist === 'bernoulli' ? 'P' : 'density'}>
        {dist === 'bernoulli' ? (
          <>
            <Bar x0={-0.2} x1={0.2} h={1 - p} color="var(--c1)" outline />
            <Bar x0={0.8} x1={1.2} h={p} color="var(--c1)" outline />
            {n > 0 && (
              <>
                <Bar x0={-0.12} x1={0.12} h={samples.filter((s) => s === 0).length / n} color="var(--c2)" />
                <Bar x0={0.88} x1={1.12} h={samples.filter((s) => s === 1).length / n} color="var(--c2)" />
              </>
            )}
          </>
        ) : (
          <>
            {n > 0 &&
              histogram(samples, LO, HI, BINS).map((c, i) => {
                const w = (HI - LO) / BINS;
                return <Bar key={i} x0={LO + i * w} x1={LO + (i + 1) * w} h={c / (n * w)} color="var(--c2)" />;
              })}
            <FnPath
              f={dist === 'normal' ? (x) => normalPdf(x, mu, sigma) : (x) => uniformPdf(x, a, b)}
              color="var(--c1)"
              samples={600}
            />
            <Segment a={[trueMean, 0]} b={[trueMean, yMax]} color="var(--c1)" dashed />
            {n > 0 && <Segment a={[mean, 0]} b={[mean, yMax]} color="var(--c2)" dashed />}
          </>
        )}
      </Plot>
      <div className="legend">
        <span style={{ color: 'var(--c1)' }}>True distribution</span>
        <span style={{ color: 'var(--c2)' }}>Samples (histogram)</span>
      </div>
      <Stats>
        <Stat label="Samples n" value={n} />
        <Stat label="True mean" value={fmt(trueMean, 3)} color="var(--c1)" />
        <Stat label="Sample mean" value={n ? fmt(mean, 3) : '—'} color="var(--c2)" />
        <Stat label="True / sample var" value={`${fmt(trueVar, 2)} / ${n ? fmt(variance, 2) : '—'}`} />
      </Stats>
      <Controls>
        {dist === 'normal' && (
          <>
            <Slider label={<Tex>{'\\mu'}</Tex>} value={mu} min={-3} max={3} onChange={change(setMu)} />
            <Slider label={<Tex>{'\\sigma'}</Tex>} value={sigma} min={0.3} max={3} onChange={change(setSigma)} />
          </>
        )}
        {dist === 'uniform' && (
          <>
            <Slider label={<Tex>a</Tex>} value={a} min={-5} max={b - 0.2} onChange={change(setA)} />
            <Slider label={<Tex>b</Tex>} value={b} min={a + 0.2} max={5} onChange={change(setB)} />
          </>
        )}
        {dist === 'bernoulli' && <Slider label={<Tex>p</Tex>} value={p} min={0} max={1} onChange={change(setP)} />}
        <div className="btn-row">
          <Button primary onClick={() => addSamples(10)}>
            +10 samples
          </Button>
          <Button onClick={() => addSamples(100)}>+100</Button>
          <Button onClick={() => addSamples(1000)}>+1000</Button>
          <Button
            onClick={() => {
              setN(0);
              setSeed((s) => s + 1);
            }}
          >
            Reset
          </Button>
        </div>
      </Controls>
    </LessonLayout>
  );
}

function Bar({ x0, x1, h, color, outline }: { x0: number; x1: number; h: number; color: string; outline?: boolean }) {
  const { x, y } = usePlot();
  return (
    <rect
      x={x(x0)}
      y={y(h)}
      width={Math.max(0, x(x1) - x(x0) - 1)}
      height={Math.max(0, y(0) - y(h))}
      fill={outline ? 'none' : color}
      fillOpacity={outline ? 0 : 0.45}
      stroke={outline ? color : 'none'}
      strokeWidth={2}
    />
  );
}
