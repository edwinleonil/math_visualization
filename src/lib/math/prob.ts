export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
export const relu = (z: number) => Math.max(0, z);
export const tanh = Math.tanh;

export const normalPdf = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));

export const uniformPdf = (x: number, a: number, b: number) => (x >= a && x <= b && b > a ? 1 / (b - a) : 0);

/** Binary cross-entropy for a single label y in {0,1} and predicted probability p. */
export function bce(y: number, p: number): number {
  const q = Math.min(1 - 1e-12, Math.max(1e-12, p));
  return -(y * Math.log(q) + (1 - y) * Math.log(1 - q));
}

/** Histogram counts over [lo, hi) with `bins` equal-width bins. */
export function histogram(samples: number[], lo: number, hi: number, bins: number): number[] {
  const counts = new Array<number>(bins).fill(0);
  const w = (hi - lo) / bins;
  for (const s of samples) {
    const i = Math.floor((s - lo) / w);
    if (i >= 0 && i < bins) counts[i]++;
  }
  return counts;
}
