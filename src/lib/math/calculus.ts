export type Fn1 = (x: number) => number;
export type Fn2 = (x: number, y: number) => number;

const H = 1e-5;

/** Central-difference derivative. */
export const derivative = (f: Fn1, x: number, h = H): number => (f(x + h) - f(x - h)) / (2 * h);

/** Numerical gradient of f(x, y). */
export function gradient(f: Fn2, x: number, y: number, h = H): [number, number] {
  return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
}

/** Sample f on a regular grid, row-major with x varying fastest (the d3-contour layout). */
export function sampleGrid(
  f: Fn2,
  xDomain: [number, number],
  yDomain: [number, number],
  nx: number,
  ny: number,
): number[] {
  const out = new Array<number>(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = yDomain[0] + ((yDomain[1] - yDomain[0]) * j) / (ny - 1);
    for (let i = 0; i < nx; i++) {
      const x = xDomain[0] + ((xDomain[1] - xDomain[0]) * i) / (nx - 1);
      out[j * nx + i] = f(x, y);
    }
  }
  return out;
}

export interface NamedFn1 {
  id: string;
  label: string;
  tex: string;
  f: Fn1;
}

export const FUNCTIONS_1D: NamedFn1[] = [
  { id: 'square', label: 'x²', tex: 'f(x)=x^2', f: (x) => x * x },
  { id: 'cubic', label: 'x³ − 3x', tex: 'f(x)=x^3-3x', f: (x) => x ** 3 - 3 * x },
  { id: 'sin', label: 'sin x', tex: 'f(x)=\\sin x', f: Math.sin },
  { id: 'exp', label: 'eˣ', tex: 'f(x)=e^{x}', f: Math.exp },
  { id: 'sigmoid', label: 'σ(x)', tex: 'f(x)=\\frac{1}{1+e^{-x}}', f: (x) => 1 / (1 + Math.exp(-x)) },
];

export interface NamedFn2 {
  id: string;
  label: string;
  tex: string;
  f: Fn2;
  domain: [number, number];
}

export const FUNCTIONS_2D: NamedFn2[] = [
  { id: 'bowl', label: 'Bowl', tex: 'f(x,y)=x^2+y^2', f: (x, y) => x * x + y * y, domain: [-3, 3] },
  {
    id: 'ellipse',
    label: 'Elongated bowl',
    tex: 'f(x,y)=x^2+5y^2',
    f: (x, y) => x * x + 5 * y * y,
    domain: [-3, 3],
  },
  { id: 'saddle', label: 'Saddle', tex: 'f(x,y)=x^2-y^2', f: (x, y) => x * x - y * y, domain: [-3, 3] },
  {
    id: 'waves',
    label: 'Waves',
    tex: 'f(x,y)=\\sin x\\cos y',
    f: (x, y) => Math.sin(x) * Math.cos(y),
    domain: [-3, 3],
  },
];
