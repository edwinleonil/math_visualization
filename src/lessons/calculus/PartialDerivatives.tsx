import { useState } from 'react';
import { Contours } from '../../components/Contours';
import { LessonLayout } from '../../components/LessonLayout';
import { Dot, DragPoint, FnPath, Plot, Segment } from '../../components/Plot';
import { Segmented, Stat, Stats, Tex, fmt } from '../../components/ui';
import { FUNCTIONS_2D, gradient } from '../../lib/math/calculus';

export default function PartialDerivatives() {
  const [fnId, setFnId] = useState('saddle');
  const [p, setP] = useState<[number, number]>([1, 0.8]);
  const fn = FUNCTIONS_2D.find((f) => f.id === fnId)!;
  const { f, domain } = fn;
  const [gx, gy] = gradient(f, p[0], p[1]);
  const z0 = f(p[0], p[1]);
  const vals = [-3, -1.5, 0, 1.5, 3].flatMap((a) => [-3, 0, 3].map((b) => f(a, b)));
  const zRange: [number, number] = [Math.min(...vals) - 0.5, Math.max(...vals) + 0.5];

  return (
    <LessonLayout
      title="Partial derivatives"
      intro={
        <p>
          A model has many parameters, so its loss is a function of many variables. A{' '}
          <strong>partial derivative</strong> asks how the output changes when you nudge <em>one</em> input
          and hold all the others fixed.
        </p>
      }
      explanation={
        <>
          <h3>Slicing the surface</h3>
          <p>
            Fix <Tex>{'y=y_0'}</Tex> and you get an ordinary one-variable function of <Tex>x</Tex>: a slice
            through the surface. Its slope is <Tex>{'\\partial f/\\partial x'}</Tex>.
          </p>
          <Tex block>{'\\frac{\\partial f}{\\partial x}(x_0,y_0)=\\lim_{h\\to0}\\frac{f(x_0+h,\\,y_0)-f(x_0,y_0)}{h}'}</Tex>
          <p>
            Do the same with <Tex>x</Tex> fixed to get <Tex>{'\\partial f/\\partial y'}</Tex>.
          </p>
          <h3>Example</h3>
          <p>
            For <Tex>{'f=x^2-y^2'}</Tex>, treat the other variable as a constant:
          </p>
          <Tex block>{'\\frac{\\partial f}{\\partial x}=2x,\\qquad \\frac{\\partial f}{\\partial y}=-2y'}</Tex>
          <p>
            Backpropagation is an efficient way of computing millions of these partial derivatives at once,
            one for each weight.
          </p>
        </>
      }
      tryThis={[
        'Drag the point on the contour map. The blue slice runs horizontally (y fixed), and the teal slice runs vertically (x fixed).',
        'On the saddle, find a point where ∂f/∂x = 0 but ∂f/∂y ≠ 0.',
        'At the centre of the saddle both partials are 0, yet it is not a minimum. Why?',
      ]}
    >
      <Segmented
        label="Function"
        value={fnId}
        onChange={setFnId}
        options={FUNCTIONS_2D.map((f) => ({ value: f.id, label: f.label }))}
      />
      <Tex block>{fn.tex}</Tex>
      <div className="two-up">
        <div>
          <h4 className="fig-title">Contour map of f(x, y)</h4>
          <Plot xDomain={domain} yDomain={domain} equalAspect xLabel="x" yLabel="y" onBackgroundClick={(q) => setP(q)}>
            <Contours f={f} levels={16} />
            <Segment a={[domain[0], p[1]]} b={[domain[1], p[1]]} color="var(--c1)" width={2.5} />
            <Segment a={[p[0], domain[0]]} b={[p[0], domain[1]]} color="var(--c4)" width={2.5} />
            <DragPoint x={p[0]} y={p[1]} color="var(--c2)" onChange={(x, y) => setP([x, y])} />
          </Plot>
        </div>
        <div>
          <h4 className="fig-title">
            Slice with y = {fmt(p[1], 2)}: f(x, y₀)
          </h4>
          <Plot xDomain={domain} yDomain={zRange} height={190} xLabel="x">
            <FnPath f={(x) => f(x, p[1])} color="var(--c1)" />
            <FnPath f={(x) => z0 + gx * (x - p[0])} color="var(--c2)" width={1.5} dashed />
            <Dot x={p[0]} y={z0} color="var(--c2)" r={5} />
          </Plot>
          <h4 className="fig-title">
            Slice with x = {fmt(p[0], 2)}: f(x₀, y)
          </h4>
          <Plot xDomain={domain} yDomain={zRange} height={190} xLabel="y">
            <FnPath f={(y) => f(p[0], y)} color="var(--c4)" />
            <FnPath f={(y) => z0 + gy * (y - p[1])} color="var(--c2)" width={1.5} dashed />
            <Dot x={p[1]} y={z0} color="var(--c2)" r={5} />
          </Plot>
        </div>
      </div>
      <Stats>
        <Stat label="(x, y)" value={`(${fmt(p[0], 2)}, ${fmt(p[1], 2)})`} />
        <Stat label="f(x, y)" value={fmt(z0, 3)} />
        <Stat label="∂f/∂x" value={fmt(gx, 3)} color="var(--c1)" />
        <Stat label="∂f/∂y" value={fmt(gy, 3)} color="var(--c4)" />
      </Stats>
    </LessonLayout>
  );
}
