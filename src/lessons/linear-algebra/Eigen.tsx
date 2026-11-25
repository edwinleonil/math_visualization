import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { Arrow, DragPoint, Plot, Segment } from '../../components/Plot';
import { Button, Controls, Slider, Stat, Stats, Tex, fmt } from '../../components/ui';
import { angleBetween, eigen2, matVec, norm, type Mat2, type Vec2 } from '../../lib/math/linalg';

const PRESETS: { label: string; m: Mat2 }[] = [
  { label: 'Symmetric', m: [[2, 1], [1, 2]] },
  { label: 'Stretch', m: [[3, 0], [0, 1]] },
  { label: 'Shear', m: [[1, 1], [0, 1]] },
  { label: 'Rotation', m: [[0, -1], [1, 0]] },
];

export default function Eigen() {
  const [m, setM] = useState<Mat2>([[2, 1], [1, 2]]);
  const [v, setV] = useState<Vec2>([1.5, 0.5]);
  const eig = eigen2(m);
  const Av = matVec(m, v);
  const aligned = norm(v) > 1e-6 && norm(Av) > 1e-6 && (angleBetween(v, Av) < 0.03 || angleBetween(v, Av) > Math.PI - 0.03);
  const set = (i: 0 | 1, j: 0 | 1) => (val: number) =>
    setM((old) => {
      const n: Mat2 = [[...old[0]], [...old[1]]] as Mat2;
      n[i][j] = val;
      return n;
    });

  return (
    <LessonLayout
      title="Eigenvectors and eigenvalues"
      intro={
        <p>
          Most vectors get knocked off their line when a matrix acts on them. <strong>Eigenvectors</strong> are
          the special directions that stay on their own line: they are only stretched or shrunk. The stretch
          factor is the <strong>eigenvalue</strong>.
        </p>
      }
      explanation={
        <>
          <h3>Definition</h3>
          <Tex block>{'A\\mathbf v=\\lambda\\mathbf v'}</Tex>
          <p>
            The eigenvalues are the solutions of <Tex>{'\\det(A-\\lambda I)=0'}</Tex>. For a 2×2 matrix:
          </p>
          <Tex block>{'\\lambda=\\frac{\\operatorname{tr}A}{2}\\pm\\sqrt{\\frac{(\\operatorname{tr}A)^2}{4}-\\det A}'}</Tex>
          <h3>Why ML cares</h3>
          <ul>
            <li>
              <strong>PCA</strong> finds the eigenvectors of the data&rsquo;s covariance matrix: the directions of
              greatest variance.
            </li>
            <li>
              The eigenvalues of the loss <em>Hessian</em> describe how curved the loss surface is in each
              direction. That decides the largest learning rate that will not diverge.
            </li>
            <li>A rotation has no real eigenvectors, because every direction gets turned.</li>
          </ul>
        </>
      }
      tryThis={[
        'Drag the purple vector v around a full circle. When v and Av line up, you have found an eigenvector.',
        'The Symmetric preset has perpendicular eigenvectors. This is always true for symmetric matrices, which is why PCA works.',
        'Try Rotation: no direction survives, so there are no real eigenvalues.',
        'Shear has only one eigen-direction. Find it.',
      ]}
    >
      <Plot xDomain={[-5, 5]} yDomain={[-4, 4]} equalAspect>
        {eig.map((e, i) => (
          <Segment
            key={i}
            a={[-e.vector[0] * 20, -e.vector[1] * 20]}
            b={[e.vector[0] * 20, e.vector[1] * 20]}
            color={i === 0 ? 'var(--c2)' : 'var(--c4)'}
            width={2}
            dashed
          />
        ))}
        <Arrow to={Av} color={aligned ? 'var(--ok)' : 'var(--c1)'} width={4} label="Av" />
        <Arrow to={v} color="var(--c5)" label="v" />
        <DragPoint
          x={v[0]}
          y={v[1]}
          color="var(--c5)"
          r={7}
          onChange={(x, y) => {
            // Snap onto an eigen-line when within ~3.5 degrees so it is easy to find.
            const p: Vec2 = [x, y];
            for (const e of eig) {
              const a = angleBetween(p, e.vector);
              if (a < 0.06 || a > Math.PI - 0.06) {
                const s = p[0] * e.vector[0] + p[1] * e.vector[1];
                return setV([s * e.vector[0], s * e.vector[1]]);
              }
            }
            setV(p);
          }}
        />
      </Plot>
      <Stats>
        {eig.length === 0 ? (
          <Stat label="Eigenvalues" value="complex" color="var(--danger)" />
        ) : (
          eig.map((e, i) => (
            <Stat
              key={i}
              label={`λ${i + 1}, direction`}
              value={`${fmt(e.value, 2)}, (${fmt(e.vector[0], 2)}, ${fmt(e.vector[1], 2)})`}
              color={i === 0 ? 'var(--c2)' : 'var(--c4)'}
            />
          ))
        )}
        <Stat
          label="v is an eigenvector?"
          value={aligned ? `Yes, λ ≈ ${fmt(Math.sign(Av[0] * v[0] + Av[1] * v[1]) * (norm(Av) / norm(v)), 2)}` : 'No'}
          color={aligned ? 'var(--ok)' : undefined}
        />
      </Stats>
      <Controls>
        <div className="btn-row">
          {PRESETS.map((p) => (
            <Button key={p.label} onClick={() => setM(p.m)}>
              {p.label}
            </Button>
          ))}
        </div>
        <Slider label={<Tex>a</Tex>} value={m[0][0]} min={-3} max={3} onChange={set(0, 0)} />
        <Slider label={<Tex>b</Tex>} value={m[0][1]} min={-3} max={3} onChange={set(0, 1)} />
        <Slider label={<Tex>c</Tex>} value={m[1][0]} min={-3} max={3} onChange={set(1, 0)} />
        <Slider label={<Tex>d</Tex>} value={m[1][1]} min={-3} max={3} onChange={set(1, 1)} />
      </Controls>
    </LessonLayout>
  );
}
