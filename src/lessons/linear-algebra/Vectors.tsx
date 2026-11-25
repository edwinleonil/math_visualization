import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { Arrow, DragPoint, Plot } from '../../components/Plot';
import { Controls, Segmented, Slider, Stat, Stats, Tex, fmt } from '../../components/ui';
import { add, norm, scale, type Vec2 } from '../../lib/math/linalg';

type Mode = 'add' | 'scale';

export default function Vectors() {
  const [u, setU] = useState<Vec2>([3, 1]);
  const [v, setV] = useState<Vec2>([1, 2]);
  const [k, setK] = useState(1.5);
  const [mode, setMode] = useState<Mode>('add');
  const sum = add(u, v);
  const ku = scale(k, u);

  return (
    <LessonLayout
      title="Vectors"
      intro={
        <p>
          A vector is a list of numbers, such as <Tex>{'\\mathbf u = (3, 1)'}</Tex>. Geometrically it is an
          arrow with a direction and a length. In ML, almost everything is a vector: one data point's features,
          a word embedding, a model's weights.
        </p>
      }
      explanation={
        <>
          <h3>Addition</h3>
          <p>Add vectors component by component. Geometrically, put them tip to tail:</p>
          <Tex block>{'\\mathbf u+\\mathbf v=(u_1+v_1,\\; u_2+v_2)'}</Tex>
          <h3>Scalar multiplication</h3>
          <p>
            Multiplying by a number <Tex>k</Tex> stretches the arrow. A negative <Tex>k</Tex> flips it around.
          </p>
          <Tex block>{'k\\mathbf u=(ku_1,\\;ku_2)'}</Tex>
          <h3>Length (norm)</h3>
          <p>By Pythagoras:</p>
          <Tex block>{'\\|\\mathbf u\\|=\\sqrt{u_1^2+u_2^2}'}</Tex>
          <p>
            In ML, the norm measures the size of a weight vector. This is what L2 regularisation penalises.
          </p>
        </>
      }
      tryThis={[
        'Drag the tips of u and v. The dashed arrows show that u + v = v + u: both routes reach the same point.',
        'In Scale mode, set k to a negative number and watch the direction flip.',
        'What value of k makes ‖ku‖ = 1? That is called normalising the vector.',
      ]}
    >
      <Segmented
        label="Operation"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'add', label: 'Addition' },
          { value: 'scale', label: 'Scaling' },
        ]}
      />
      <Plot xDomain={[-6, 6]} yDomain={[-5, 5]} equalAspect>
        {mode === 'add' ? (
          <>
            <Arrow from={u} to={sum} color="var(--c4)" width={2} dashed />
            <Arrow from={v} to={sum} color="var(--c1)" width={2} dashed />
            <Arrow to={sum} color="var(--c2)" label="u + v" />
            <Arrow to={u} color="var(--c1)" label="u" />
            <Arrow to={v} color="var(--c4)" label="v" />
            <DragPoint x={u[0]} y={u[1]} color="var(--c1)" r={6} snap={0.5} onChange={(x, y) => setU([x, y])} />
            <DragPoint x={v[0]} y={v[1]} color="var(--c4)" r={6} snap={0.5} onChange={(x, y) => setV([x, y])} />
          </>
        ) : (
          <>
            <Arrow to={ku} color="var(--c2)" width={6} label={`${fmt(k, 2)}·u`} />
            <Arrow to={u} color="var(--c1)" label="u" />
            <DragPoint x={u[0]} y={u[1]} color="var(--c1)" r={6} snap={0.5} onChange={(x, y) => setU([x, y])} />
          </>
        )}
      </Plot>
      <Stats>
        <Stat label="u" value={`(${fmt(u[0], 1)}, ${fmt(u[1], 1)})`} color="var(--c1)" />
        {mode === 'add' ? (
          <>
            <Stat label="v" value={`(${fmt(v[0], 1)}, ${fmt(v[1], 1)})`} color="var(--c4)" />
            <Stat label="u + v" value={`(${fmt(sum[0], 1)}, ${fmt(sum[1], 1)})`} color="var(--c2)" />
          </>
        ) : (
          <Stat label="k·u" value={`(${fmt(ku[0], 2)}, ${fmt(ku[1], 2)})`} color="var(--c2)" />
        )}
        <Stat label="‖u‖" value={fmt(norm(u), 2)} />
      </Stats>
      {mode === 'scale' && (
        <Controls>
          <Slider label={<Tex>k</Tex>} value={k} min={-2} max={2.5} onChange={setK} />
        </Controls>
      )}
    </LessonLayout>
  );
}
