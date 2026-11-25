import { linearDataset, mse } from '../../lib/math/regression';

/** Default dataset shared by the regression lessons: y ≈ 1.2x + 0.8 with noise. */
export const DEFAULT_POINTS = linearDataset(24, 1.2, 0.8, 0.9, 42);

export const W_DOMAIN: [number, number] = [-2, 4];
export const B_DOMAIN: [number, number] = [-3, 4];

export const lossFn = (points: { x: number; y: number }[]) => (w: number, b: number) => mse(points, w, b);
