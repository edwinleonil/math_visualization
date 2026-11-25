export type Vec2 = [number, number];
/** Row-major 2x2 matrix [[a, b], [c, d]] */
export type Mat2 = [[number, number], [number, number]];

export const add = (u: Vec2, v: Vec2): Vec2 => [u[0] + v[0], u[1] + v[1]];
export const sub = (u: Vec2, v: Vec2): Vec2 => [u[0] - v[0], u[1] - v[1]];
export const scale = (k: number, v: Vec2): Vec2 => [k * v[0], k * v[1]];
export const dot = (u: Vec2, v: Vec2): number => u[0] * v[0] + u[1] * v[1];
export const norm = (v: Vec2): number => Math.hypot(v[0], v[1]);

/** Angle between two vectors in radians (0 if either is the zero vector). */
export function angleBetween(u: Vec2, v: Vec2): number {
  const n = norm(u) * norm(v);
  if (n === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / n)));
}

/** Projection of u onto v. */
export function project(u: Vec2, v: Vec2): Vec2 {
  const vv = dot(v, v);
  return vv === 0 ? [0, 0] : scale(dot(u, v) / vv, v);
}

export const matVec = (m: Mat2, v: Vec2): Vec2 => [
  m[0][0] * v[0] + m[0][1] * v[1],
  m[1][0] * v[0] + m[1][1] * v[1],
];

export const det = (m: Mat2): number => m[0][0] * m[1][1] - m[0][1] * m[1][0];
export const trace = (m: Mat2): number => m[0][0] + m[1][1];

export interface Eigen {
  value: number;
  vector: Vec2; // unit length
}

/** Real eigenpairs of a 2x2 matrix. Returns [] when the eigenvalues are complex. */
export function eigen2(m: Mat2): Eigen[] {
  const [[a, b], [c, d]] = m;
  const t = trace(m);
  const disc = (t * t) / 4 - det(m);
  if (disc < -1e-12) return [];
  const s = Math.sqrt(Math.max(0, disc));
  const values = s < 1e-12 ? [t / 2] : [t / 2 + s, t / 2 - s];
  const out: Eigen[] = [];
  for (const l of values) {
    let v: Vec2;
    if (Math.abs(b) > 1e-12) v = [b, l - a];
    else if (Math.abs(c) > 1e-12) v = [l - d, c];
    else {
      // Diagonal matrix: the eigenvectors are the axes.
      if (values.length === 1) return [
        { value: l, vector: [1, 0] },
        { value: l, vector: [0, 1] },
      ];
      v = Math.abs(l - a) < 1e-12 ? [1, 0] : [0, 1];
    }
    const n = norm(v);
    out.push({ value: l, vector: [v[0] / n, v[1] / n] });
  }
  return out;
}
