import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { Arrow, Plot, Polygon, Segment } from '../../components/Plot';
import { Button, Controls, Slider, Stat, Stats, Tex, Toggle, fmt } from '../../components/ui';
import { det, matVec, type Mat2, type Vec2 } from '../../lib/math/linalg';

const PRESETS: { label: string; m: Mat2 }[] = [
  { label: 'Identity', m: [[1, 0], [0, 1]] },
  { label: 'Scale', m: [[2, 0], [0, 0.5]] },
  { label: 'Rotate 45°', m: [[Math.SQRT1_2, -Math.SQRT1_2], [Math.SQRT1_2, Math.SQRT1_2]] },
  { label: 'Shear', m: [[1, 1], [0, 1]] },
  { label: 'Reflect', m: [[-1, 0], [0, 1]] },
  { label: 'Collapse', m: [[1, 2], [0.5, 1]] },
];

/** Interpolate between identity and m so the user can animate the transformation. */
const lerpMat = (m: Mat2, t: number): Mat2 => [
  [1 + (m[0][0] - 1) * t, m[0][1] * t],
  [m[1][0] * t, 1 + (m[1][1] - 1) * t],
];

export default function MatrixTransform() {
  const [m, setM] = useState<Mat2>([[1, 1], [0, 1]]);
  const [t, setT] = useState(1);
  const [showOriginal, setShowOriginal] = useState(true);
  const M = lerpMat(m, t);
  const set = (i: 0 | 1, j: 0 | 1) => (val: number) =>
    setM((old) => {
      const n: Mat2 = [[...old[0]], [...old[1]]] as Mat2;
      n[i][j] = val;
      return n;
    });

  const i_hat = matVec(M, [1, 0]);
  const j_hat = matVec(M, [0, 1]);
  const D = det(M);
  const lines: { a: Vec2; b: Vec2; axis: boolean }[] = [];
  for (let k = -8; k <= 8; k++) {
    lines.push({ a: matVec(M, [k, -8]), b: matVec(M, [k, 8]), axis: k === 0 });
    lines.push({ a: matVec(M, [-8, k]), b: matVec(M, [8, k]), axis: k === 0 });
  }

  return (
    <LessonLayout
      title="Matrices as transformations"
      intro={
        <p>
          A matrix is a function that moves every point in space. A 2×2 matrix keeps grid lines straight,
          parallel and evenly spaced, and keeps the origin fixed. Such a function is called a{' '}
          <strong>linear transformation</strong>. Every layer of a neural network starts with one.
        </p>
      }
      explanation={
        <>
          <h3>The columns tell you everything</h3>
          <Tex block>{'A=\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix},\\quad A\\hat\\imath=\\begin{bmatrix}a\\\\c\\end{bmatrix},\\quad A\\hat\\jmath=\\begin{bmatrix}b\\\\d\\end{bmatrix}'}</Tex>
          <p>
            The first column is where the unit vector <Tex>{'\\hat\\imath'}</Tex> lands (blue), and the second is
            where <Tex>{'\\hat\\jmath'}</Tex> lands (teal). Any other vector follows along:
          </p>
          <Tex block>{'A\\begin{bmatrix}x\\\\y\\end{bmatrix}=x\\,(A\\hat\\imath)+y\\,(A\\hat\\jmath)'}</Tex>
          <h3>The determinant</h3>
          <Tex block>{'\\det A = ad-bc'}</Tex>
          <p>
            This is the factor by which areas change (the orange square). A negative determinant means space
            was flipped. A determinant of <strong>zero</strong> means space was squashed onto a line, and
            information was lost: the matrix cannot be inverted.
          </p>
        </>
      }
      tryThis={[
        'Drag the animation slider from 0 to 1 to watch the grid morph.',
        'Try the Collapse preset: det = 0 and the whole plane is flattened onto a line.',
        'Find a matrix with a negative determinant. Notice that the orange square is mirrored.',
      ]}
    >
      <Plot xDomain={[-5, 5]} yDomain={[-4, 4]} equalAspect>
        {showOriginal && (
          <g opacity={0.5}>
            {Array.from({ length: 17 }, (_, k) => k - 8).map((k) => (
              <g key={k}>
                <Segment a={[k, -8]} b={[k, 8]} color="var(--grid)" width={1} />
                <Segment a={[-8, k]} b={[8, k]} color="var(--grid)" width={1} />
              </g>
            ))}
          </g>
        )}
        {lines.map((l, i) => (
          <Segment key={i} a={l.a} b={l.b} color={l.axis ? 'var(--text)' : 'var(--c1)'} width={l.axis ? 1.6 : 0.8} />
        ))}
        <Polygon
          points={[[0, 0], i_hat, matVec(M, [1, 1]), j_hat]}
          fill={D < 0 ? 'var(--danger)' : 'var(--c2)'}
          opacity={0.35}
          stroke={D < 0 ? 'var(--danger)' : 'var(--c2)'}
        />
        <Arrow to={i_hat} color="var(--c1)" label="Aî" />
        <Arrow to={j_hat} color="var(--c4)" label="Aĵ" />
      </Plot>
      <Stats>
        <Stat label="det A" value={fmt(D, 2)} color={Math.abs(D) < 1e-6 ? 'var(--danger)' : undefined} />
        <Stat label="Aî" value={`(${fmt(i_hat[0], 2)}, ${fmt(i_hat[1], 2)})`} color="var(--c1)" />
        <Stat label="Aĵ" value={`(${fmt(j_hat[0], 2)}, ${fmt(j_hat[1], 2)})`} color="var(--c4)" />
      </Stats>
      <Controls>
        <div className="btn-row">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              onClick={() => {
                setM(p.m);
                setT(1);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <Slider label={<Tex>a</Tex>} value={m[0][0]} min={-2} max={2} onChange={set(0, 0)} />
        <Slider label={<Tex>b</Tex>} value={m[0][1]} min={-2} max={2} onChange={set(0, 1)} />
        <Slider label={<Tex>c</Tex>} value={m[1][0]} min={-2} max={2} onChange={set(1, 0)} />
        <Slider label={<Tex>d</Tex>} value={m[1][1]} min={-2} max={2} onChange={set(1, 1)} />
        <Slider label="Animate" value={t} min={0} max={1} onChange={setT} />
        <Toggle label="Show the original grid" checked={showOriginal} onChange={setShowOriginal} />
      </Controls>
    </LessonLayout>
  );
}
