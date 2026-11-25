import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { Arrow, DragPoint, Plot, Segment, usePlot } from '../../components/Plot';
import { Stat, Stats, Tex, fmt } from '../../components/ui';
import { angleBetween, dot, norm, project, type Vec2 } from '../../lib/math/linalg';

export default function DotProduct() {
  const [u, setU] = useState<Vec2>([2, 3]);
  const [v, setV] = useState<Vec2>([4, 1]);
  const d = dot(u, v);
  const theta = angleBetween(u, v);
  const proj = project(u, v);
  const cos = Math.cos(theta);

  return (
    <LessonLayout
      title="The dot product"
      intro={
        <p>
          The dot product turns two vectors into a single number that measures how much they{' '}
          <em>point the same way</em>. It is everywhere in ML: a neuron computes <Tex>{'\\mathbf w\\cdot\\mathbf x'}</Tex>,
          and attention in transformers compares queries and keys with dot products.
        </p>
      }
      explanation={
        <>
          <h3>Two equivalent definitions</h3>
          <Tex block>{'\\mathbf u\\cdot\\mathbf v = u_1v_1+u_2v_2 = \\|\\mathbf u\\|\\,\\|\\mathbf v\\|\\cos\\theta'}</Tex>
          <p>The algebraic form is easy to compute. The geometric form explains what it means:</p>
          <ul>
            <li>
              <strong>Positive</strong>: the angle is under 90°, so they broadly agree.
            </li>
            <li>
              <strong>Zero</strong>: they are perpendicular (<em>orthogonal</em>).
            </li>
            <li>
              <strong>Negative</strong>: they point in opposing directions.
            </li>
          </ul>
          <h3>Projection</h3>
          <p>
            The shadow of <Tex>{'\\mathbf u'}</Tex> on <Tex>{'\\mathbf v'}</Tex> (the orange segment) is:
          </p>
          <Tex block>{'\\text{proj}_{\\mathbf v}\\mathbf u=\\frac{\\mathbf u\\cdot\\mathbf v}{\\|\\mathbf v\\|^2}\\,\\mathbf v'}</Tex>
          <h3>Cosine similarity</h3>
          <p>
            <Tex>{'\\cos\\theta'}</Tex> on its own ignores length. Search engines and embedding models use it to
            ask &ldquo;how similar are these two items?&rdquo;
          </p>
        </>
      }
      tryThis={[
        'Make the two vectors perpendicular. The dot product becomes 0 and the projection vanishes.',
        'Make the angle obtuse (over 90°): the dot product goes negative and the projection points backwards.',
        'Double the length of u. The dot product doubles, but the cosine similarity stays the same.',
      ]}
    >
      <Plot xDomain={[-6, 6]} yDomain={[-5, 5]} equalAspect>
        <Segment a={[-v[0] * 10, -v[1] * 10]} b={[v[0] * 10, v[1] * 10]} color="var(--grid)" width={1} />
        <AngleArc u={u} v={v} />
        <Segment a={u} b={proj} color="var(--muted)" dashed />
        <Arrow to={proj} color="var(--c2)" width={5} />
        <Arrow to={v} color="var(--c4)" label="v" />
        <Arrow to={u} color="var(--c1)" label="u" />
        <DragPoint x={u[0]} y={u[1]} color="var(--c1)" r={6} snap={0.25} onChange={(x, y) => setU([x, y])} />
        <DragPoint x={v[0]} y={v[1]} color="var(--c4)" r={6} snap={0.25} onChange={(x, y) => setV([x, y])} />
      </Plot>
      <Stats>
        <Stat
          label="u · v"
          value={fmt(d, 2)}
          color={Math.abs(d) < 1e-9 ? 'var(--ok)' : d > 0 ? 'var(--c1)' : 'var(--danger)'}
        />
        <Stat label="θ" value={`${fmt((theta * 180) / Math.PI, 1)}°`} />
        <Stat label="cos θ" value={fmt(cos, 3)} />
        <Stat label="‖u‖ ‖v‖" value={fmt(norm(u) * norm(v), 2)} />
      </Stats>
    </LessonLayout>
  );
}

/** Small arc marking the angle between u and v at the origin. */
function AngleArc({ u, v }: { u: Vec2; v: Vec2 }) {
  const { x, y } = usePlot();
  if (norm(u) === 0 || norm(v) === 0) return null;
  const r = 28;
  const a1 = Math.atan2(u[1], u[0]);
  const a2 = Math.atan2(v[1], v[0]);
  let delta = a2 - a1;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const cx = x(0);
  const cy = y(0);
  const p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
  const p2 = [cx + r * Math.cos(a1 + delta), cy - r * Math.sin(a1 + delta)];
  const sweep = delta > 0 ? 0 : 1; // SVG y is flipped
  return (
    <path
      d={`M${cx},${cy} L${p1[0]},${p1[1]} A${r},${r} 0 0 ${sweep} ${p2[0]},${p2[1]} Z`}
      fill="var(--c5)"
      fillOpacity={0.18}
      stroke="var(--c5)"
    />
  );
}
