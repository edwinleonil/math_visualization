import { useState } from 'react';
import { Contours } from '../../components/Contours';
import { LessonLayout } from '../../components/LessonLayout';
import { Arrow, DataPath, DragPoint, Plot } from '../../components/Plot';
import { Button, Controls, Segmented, Stat, Stats, Tex, Toggle, fmt } from '../../components/ui';
import { FUNCTIONS_2D, gradient } from '../../lib/math/calculus';

export default function GradientField() {
  const [fnId, setFnId] = useState('waves');
  const [p, setP] = useState<[number, number]>([0.6, 0.9]);
  const [showField, setShowField] = useState(true);
  const [descend, setDescend] = useState(false);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const fn = FUNCTIONS_2D.find((f) => f.id === fnId)!;
  const { f, domain } = fn;
  const [gx, gy] = gradient(f, p[0], p[1]);
  const gnorm = Math.hypot(gx, gy);

  // Grid of arrows, normalised so the field reads as directions; the length hints at magnitude.
  const n = 13;
  const field: { at: [number, number]; g: [number, number] }[] = [];
  let maxG = 1e-9;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const x = domain[0] + ((domain[1] - domain[0]) * (i + 0.5)) / n;
      const y = domain[0] + ((domain[1] - domain[0]) * (j + 0.5)) / n;
      const g = gradient(f, x, y);
      maxG = Math.max(maxG, Math.hypot(g[0], g[1]));
      field.push({ at: [x, y], g });
    }
  const cell = (domain[1] - domain[0]) / n;
  const sign = descend ? -1 : 1;

  const followDownhill = () => {
    const path: [number, number][] = [p];
    let [x, y] = p;
    for (let k = 0; k < 200; k++) {
      const [ax, ay] = gradient(f, x, y);
      if (Math.hypot(ax, ay) < 1e-3) break;
      x -= 0.05 * ax;
      y -= 0.05 * ay;
      path.push([x, y]);
    }
    setTrail(path);
  };

  return (
    <LessonLayout
      title="The gradient"
      intro={
        <p>
          Put all the partial derivatives into one vector and you get the <strong>gradient</strong>{' '}
          <Tex>{'\\nabla f'}</Tex>. At every point it is an arrow pointing in the direction of{' '}
          <em>steepest ascent</em>, and its length tells you how steep that is.
        </p>
      }
      explanation={
        <>
          <h3>Definition</h3>
          <Tex block>{'\\nabla f(x,y)=\\begin{bmatrix}\\partial f/\\partial x\\\\ \\partial f/\\partial y\\end{bmatrix}'}</Tex>
          <h3>Key facts</h3>
          <ul>
            <li>
              <Tex>{'\\nabla f'}</Tex> points uphill, so <Tex>{'-\\nabla f'}</Tex> points downhill. That is the
              whole idea behind gradient descent.
            </li>
            <li>The gradient is always perpendicular to the contour lines.</li>
            <li>
              At a minimum, maximum or saddle, <Tex>{'\\nabla f=\\mathbf 0'}</Tex>.
            </li>
          </ul>
          <h3>Directional derivative</h3>
          <p>
            The slope in any unit direction <Tex>{'\\mathbf u'}</Tex> is <Tex>{'\\nabla f\\cdot\\mathbf u'}</Tex>.
            By the dot-product lesson this is largest when <Tex>{'\\mathbf u'}</Tex> points along{' '}
            <Tex>{'\\nabla f'}</Tex>, which is why the gradient is the steepest direction.
          </p>
        </>
      }
      tryThis={[
        'Notice that every arrow crosses the contour lines at a right angle.',
        'Switch to "−∇f (downhill)" and press "Follow downhill" to trace a gradient-descent path.',
        'On the saddle, start very close to y = 0 and follow downhill. The path lingers near the saddle point before escaping.',
      ]}
    >
      <Segmented
        label="Function"
        value={fnId}
        onChange={(id) => {
          setFnId(id);
          setTrail([]);
        }}
        options={FUNCTIONS_2D.map((f) => ({ value: f.id, label: f.label }))}
      />
      <Tex block>{fn.tex}</Tex>
      <Plot
        xDomain={domain}
        yDomain={domain}
        equalAspect
        xLabel="x"
        yLabel="y"
        onBackgroundClick={(q) => {
          setP(q);
          setTrail([]);
        }}
      >
        <Contours f={f} levels={16} />
        {showField &&
          field.map(({ at, g }, k) => {
            const len = (0.8 * cell * Math.sqrt(Math.hypot(g[0], g[1]) / maxG)) / (Math.hypot(g[0], g[1]) || 1);
            return (
              <Arrow
                key={k}
                from={at}
                to={[at[0] + sign * g[0] * len, at[1] + sign * g[1] * len]}
                color="var(--muted)"
                width={1.3}
              />
            );
          })}
        {trail.length > 1 && <DataPath points={trail} color="var(--c4)" width={2.5} />}
        {gnorm > 1e-6 && (
          <Arrow
            from={p}
            to={[p[0] + (sign * gx * 1.2) / Math.max(1, gnorm), p[1] + (sign * gy * 1.2) / Math.max(1, gnorm)]}
            color="var(--c2)"
            width={4}
            label={descend ? '−∇f' : '∇f'}
          />
        )}
        <DragPoint
          x={p[0]}
          y={p[1]}
          color="var(--c2)"
          onChange={(x, y) => {
            setP([x, y]);
            setTrail([]);
          }}
        />
      </Plot>
      <Stats>
        <Stat label="∇f" value={`(${fmt(gx, 2)}, ${fmt(gy, 2)})`} color="var(--c2)" />
        <Stat label="‖∇f‖ (steepness)" value={fmt(gnorm, 3)} />
        <Stat label="f(x, y)" value={fmt(f(p[0], p[1]), 3)} />
      </Stats>
      <Controls>
        <Segmented
          label="Direction"
          value={descend ? 'down' : 'up'}
          onChange={(v) => setDescend(v === 'down')}
          options={[
            { value: 'up', label: '∇f (uphill)' },
            { value: 'down', label: '−∇f (downhill)' },
          ]}
        />
        <Toggle label="Show the gradient field" checked={showField} onChange={setShowField} />
        <div className="btn-row">
          <Button primary onClick={followDownhill}>
            Follow downhill
          </Button>
          <Button onClick={() => setTrail([])}>Clear path</Button>
        </div>
      </Controls>
    </LessonLayout>
  );
}
