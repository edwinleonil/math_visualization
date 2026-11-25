import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { Dot, DragPoint, FnPath, Plot } from '../../components/Plot';
import { Segmented, Stat, Stats, Tex, Toggle, fmt } from '../../components/ui';
import { derivative } from '../../lib/math/calculus';
import { relu, sigmoid, tanh } from '../../lib/math/prob';

const ACTS = [
  { id: 'relu', label: 'ReLU', tex: '\\text{ReLU}(z)=\\max(0,z)', f: relu, color: 'var(--c1)' },
  { id: 'leaky', label: 'Leaky ReLU', tex: '\\text{LReLU}(z)=\\max(0.1z,\\,z)', f: (z: number) => (z > 0 ? z : 0.1 * z), color: 'var(--c4)' },
  { id: 'sigmoid', label: 'Sigmoid', tex: '\\sigma(z)=\\frac{1}{1+e^{-z}}', f: sigmoid, color: 'var(--c2)' },
  { id: 'tanh', label: 'tanh', tex: '\\tanh(z)=\\frac{e^z-e^{-z}}{e^z+e^{-z}}', f: tanh, color: 'var(--c5)' },
  {
    id: 'gelu',
    label: 'GELU',
    tex: '\\text{GELU}(z)\\approx z\\,\\sigma(1.702z)',
    f: (z: number) => z * sigmoid(1.702 * z),
    color: 'var(--c3)',
  },
];

export default function Activations() {
  const [id, setId] = useState('sigmoid');
  const [z0, setZ0] = useState(3);
  const [compare, setCompare] = useState(false);
  const act = ACTS.find((a) => a.id === id)!;
  const fz = act.f(z0);
  const dz = derivative(act.f, z0);
  const shown = compare ? ACTS : [act];

  return (
    <LessonLayout
      title="Activation functions"
      intro={
        <p>
          A neural-network layer computes <Tex>{'\\mathbf a=\\phi(W\\mathbf x+\\mathbf b)'}</Tex>. Without the
          non-linear <strong>activation</strong> <Tex>{'\\phi'}</Tex>, stacking layers would be pointless:
          a product of matrices is just another matrix. The activation lets networks bend and fold space.
        </p>
      }
      explanation={
        <>
          <h3>{act.label}</h3>
          <Tex block>{act.tex}</Tex>
          <h3>Why the derivative matters</h3>
          <p>
            Backpropagation multiplies the derivatives of every layer together using the chain rule:
          </p>
          <Tex block>{'\\frac{\\partial L}{\\partial z_1}=\\frac{\\partial L}{\\partial a_n}\\prod_{k}\\phi\'(z_k)\\,W_k'}</Tex>
          <p>
            If <Tex>{"\\phi'"}</Tex> is small (the sigmoid&rsquo;s is at most 0.25), the product shrinks
            exponentially with depth. This is the <strong>vanishing gradient</strong> problem, and it made deep
            networks hard to train before ReLU.
          </p>
          <h3>Common choices</h3>
          <ul>
            <li>
              <strong>ReLU</strong>: cheap, with a derivative of 1 for positive inputs. Neurons can &ldquo;die&rdquo; if{' '}
              <Tex>z</Tex> stays negative.
            </li>
            <li>
              <strong>Leaky ReLU</strong>: keeps a small slope for negative inputs, so neurons never die.
            </li>
            <li>
              <strong>Sigmoid and tanh</strong>: smooth, but saturate (become flat) for large <Tex>{'|z|'}</Tex>.
            </li>
            <li>
              <strong>GELU</strong>: a smooth ReLU, used in transformers.
            </li>
          </ul>
        </>
      }
      tryThis={[
        'With the sigmoid, drag z to 5. The derivative is almost 0, so the gradient barely flows through.',
        'What is the largest derivative the sigmoid ever has? Where does it occur?',
        'Switch to ReLU and drag z below 0. The derivative is exactly 0: a "dead" neuron.',
        'Turn on "Compare all" to see the activations side by side.',
      ]}
    >
      <Segmented label="Activation" value={id} onChange={setId} options={ACTS.map((a) => ({ value: a.id, label: a.label }))} />
      <Toggle label="Compare all" checked={compare} onChange={setCompare} />
      <div className="two-up">
        <div>
          <h4 className="fig-title">φ(z)</h4>
          <Plot xDomain={[-6, 6]} yDomain={[-2, 4]} height={300} xLabel="z">
            {shown.map((a) => (
              <FnPath key={a.id} f={a.f} color={a.color} width={a.id === id ? 3 : 1.5} />
            ))}
            <DragPoint x={z0} y={fz} color={act.color} onChange={(z) => setZ0(Math.max(-6, Math.min(6, z)))} />
            <FnPath f={(z) => fz + dz * (z - z0)} color="var(--muted)" width={1.2} />
          </Plot>
        </div>
        <div>
          <h4 className="fig-title">φ′(z), the gradient that flows backwards</h4>
          <Plot xDomain={[-6, 6]} yDomain={[-0.2, 1.3]} height={300} xLabel="z">
            {shown.map((a) => (
              <FnPath key={a.id} f={(z) => derivative(a.f, z)} color={a.color} width={a.id === id ? 3 : 1.5} />
            ))}
            <Dot x={z0} y={dz} color={act.color} r={6} />
          </Plot>
        </div>
      </div>
      {compare && (
        <div className="legend">
          {ACTS.map((a) => (
            <span key={a.id} style={{ color: a.color }}>
              {a.label}
            </span>
          ))}
        </div>
      )}
      <Stats>
        <Stat label="z" value={fmt(z0, 2)} />
        <Stat label="φ(z)" value={fmt(fz, 3)} color={act.color} />
        <Stat label="φ′(z)" value={fmt(dz, 4)} color={dz < 0.05 ? 'var(--danger)' : act.color} />
        <Stat label="φ′ after 10 such layers" value={fmt(dz ** 10, 6)} />
      </Stats>
    </LessonLayout>
  );
}
