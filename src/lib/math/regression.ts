import { mulberry32, randn } from './rng';

export type Point = { x: number; y: number };

export const predict = (w: number, b: number, x: number) => w * x + b;

export function mse(points: Point[], w: number, b: number): number {
  if (points.length === 0) return 0;
  let s = 0;
  for (const p of points) {
    const r = predict(w, b, p.x) - p.y;
    s += r * r;
  }
  return s / points.length;
}

/** Analytic gradient of the MSE with respect to (w, b). */
export function mseGrad(points: Point[], w: number, b: number): [number, number] {
  const n = points.length;
  if (n === 0) return [0, 0];
  let gw = 0;
  let gb = 0;
  for (const p of points) {
    const r = predict(w, b, p.x) - p.y;
    gw += r * p.x;
    gb += r;
  }
  return [(2 * gw) / n, (2 * gb) / n];
}

/** Closed-form ordinary least squares. */
export function leastSquares(points: Point[]): { w: number; b: number } {
  const n = points.length;
  if (n === 0) return { w: 0, b: 0 };
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
  }
  const w = sxx === 0 ? 0 : sxy / sxx;
  return { w, b: my - w * mx };
}

export function linearDataset(n: number, w: number, b: number, noise: number, seed = 1): Point[] {
  const rand = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const x = rand() * 8 - 4;
    return { x, y: w * x + b + noise * randn(rand) };
  });
}

/** Solve A x = y by Gaussian elimination with partial pivoting. */
export function solve(A: number[][], y: number[]): number[] {
  const n = y.length;
  const M = A.map((row, i) => [...row, y[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / (M[r][r] || 1e-12);
  }
  return x;
}

/** Polynomial least-squares fit with a tiny ridge term for numerical stability. Returns c0..cd. */
export function polyFit(points: Point[], degree: number, ridge = 1e-8): number[] {
  const d = degree + 1;
  const A = Array.from({ length: d }, () => new Array<number>(d).fill(0));
  const y = new Array<number>(d).fill(0);
  for (const p of points) {
    const pow = Array.from({ length: d }, (_, i) => p.x ** i);
    for (let i = 0; i < d; i++) {
      y[i] += pow[i] * p.y;
      for (let j = 0; j < d; j++) A[i][j] += pow[i] * pow[j];
    }
  }
  for (let i = 0; i < d; i++) A[i][i] += ridge;
  return solve(A, y);
}

export const polyEval = (c: number[], x: number) => c.reduceRight((acc, ci) => acc * x + ci, 0);
