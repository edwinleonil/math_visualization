import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { Dot, DragPoint, FnPath, Plot, Segment } from '../../components/Plot';
import { Controls, Segmented, Slider, Stat, Stats, Tex, Toggle, fmt } from '../../components/ui';
import { derivative, FUNCTIONS_1D } from '../../lib/math/calculus';

export default function Derivative() {
  const [fnId, setFnId] = useState('cubic');
  const [x0, setX0] = useState(0.5);
  const [h, setH] = useState(1);
  const [showSecant, setShowSecant] = useState(true);
  const fn = FUNCTIONS_1D.find((f) => f.id === fnId)!;
  const f = fn.f;
  const slope = derivative(f, x0);
  const secant = (f(x0 + h) - f(x0)) / h;
  const y0 = f(x0);

  return (
    <LessonLayout
      title="Derivatives"
      intro={
        <p>
          The derivative <Tex>{"f'(x)"}</Tex> answers one question: if I nudge <Tex>x</Tex> a little, how
          much does <Tex>{'f(x)'}</Tex> change? Geometrically it is the <strong>slope of the tangent line</strong>.
          Training a model is the same question asked of the loss: if I nudge this weight, does the loss go up
          or down?
        </p>
      }
      explanation={
        <>
          <h3>The limit definition</h3>
          <p>Start with the slope of a secant line through two points, then shrink the gap <Tex>h</Tex>:</p>
          <Tex block>{"f'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}"}</Tex>
          <h3>Reading the derivative</h3>
          <ul>
            <li>
              <Tex>{"f'(x)>0"}</Tex>: <Tex>f</Tex> is increasing, so step <em>left</em> to go downhill.
            </li>
            <li>
              <Tex>{"f'(x)<0"}</Tex>: <Tex>f</Tex> is decreasing, so step <em>right</em> to go downhill.
            </li>
            <li>
              <Tex>{"f'(x)=0"}</Tex>: a flat spot, which could be a minimum, maximum or saddle.
            </li>
          </ul>
          <p>That is gradient descent in one dimension: always move against the sign of the derivative.</p>
          <h3>Useful rules</h3>
          <Tex block>{"(x^n)'=nx^{n-1},\\quad (e^x)'=e^x,\\quad \\sigma'(x)=\\sigma(x)(1-\\sigma(x))"}</Tex>
        </>
      }
      tryThis={[
        'Shrink h towards 0 and watch the orange secant line converge to the blue tangent.',
        'For x³ − 3x, find the two points where the tangent is flat (the derivative is 0).',
        'For σ(x), where is the slope largest? Why might a very flat sigmoid be a problem for training?',
      ]}
    >
      <Segmented
        label="Function"
        value={fnId}
        onChange={setFnId}
        options={FUNCTIONS_1D.map((f) => ({ value: f.id, label: f.label }))}
      />
      <Tex block>{fn.tex}</Tex>
      <div>
        <h4 className="fig-title">f(x) with tangent line</h4>
        <Plot xDomain={[-3, 3]} yDomain={[-4, 4]} height={300}>
          <FnPath f={f} color="var(--text)" />
          {showSecant && (
            <>
              <FnPath f={(x) => y0 + secant * (x - x0)} color="var(--c2)" width={1.5} dashed />
              <Dot x={x0 + h} y={f(x0 + h)} color="var(--c2)" r={5} />
            </>
          )}
          <FnPath f={(x) => y0 + slope * (x - x0)} color="var(--c1)" width={2} />
          <Segment a={[x0, y0]} b={[x0 + 1, y0]} color="var(--muted)" dashed />
          <Segment a={[x0 + 1, y0]} b={[x0 + 1, y0 + slope]} color="var(--c1)" dashed />
          <DragPoint x={x0} y={y0} color="var(--c1)" onChange={(x) => setX0(Math.max(-3, Math.min(3, x)))} />
        </Plot>
      </div>
      <div>
        <h4 className="fig-title">f′(x), the slope at every point</h4>
        <Plot xDomain={[-3, 3]} yDomain={[-4, 6]} height={200}>
          <FnPath f={(x) => derivative(f, x)} color="var(--c1)" />
          <Segment a={[x0, 0]} b={[x0, slope]} color="var(--c1)" dashed />
          <Dot x={x0} y={slope} color="var(--c1)" r={6} />
        </Plot>
      </div>
      <Stats>
        <Stat label="x" value={fmt(x0, 2)} />
        <Stat label="f(x)" value={fmt(y0, 3)} />
        <Stat label="f′(x)" value={fmt(slope, 3)} color="var(--c1)" />
        {showSecant && <Stat label="Secant slope" value={fmt(secant, 3)} color="var(--c2)" />}
      </Stats>
      <Controls>
        <Slider label={<Tex>x</Tex>} value={x0} min={-3} max={3} onChange={setX0} />
        <Slider label={<Tex>h</Tex>} value={h} min={0.01} max={2} onChange={setH} />
        <Toggle label="Show secant line" checked={showSecant} onChange={setShowSecant} />
      </Controls>
    </LessonLayout>
  );
}
