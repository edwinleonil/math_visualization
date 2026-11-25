import katex from 'katex';
import { useEffect, useRef, type ReactNode } from 'react';

/** Render a LaTeX string with KaTeX. */
export function Tex({ children, block }: { children: string; block?: boolean }) {
  const html = katex.renderToString(children, { displayMode: !!block, throwOnError: false });
  return block ? (
    <div className="tex-block" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  format = (v) => v.toFixed(2),
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="slider">
      <span className="slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <output>{format(value)}</output>
    </label>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Button({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button className={primary ? 'btn primary' : 'btn'} onClick={onClick}>
      {children}
    </button>
  );
}

/** Labelled numeric readout. */
export function Stat({ label, value, color }: { label: ReactNode; value: ReactNode; color?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
      </div>
    </div>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return <div className="stats">{children}</div>;
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="controls">{children}</div>;
}

/** Calls `fn` on every animation frame while `running` is true. */
export function useAnimationLoop(running: boolean, fn: () => void, fps = 30) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last >= 1000 / fps) {
        last = t;
        fnRef.current();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, fps]);
}

export const fmt = (v: number, d = 3) => (Number.isFinite(v) ? (Math.abs(v) >= 1e4 ? v.toExponential(2) : v.toFixed(d)) : '∞');
