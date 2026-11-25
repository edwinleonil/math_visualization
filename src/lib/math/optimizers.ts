import type { Fn2 } from './calculus';
import { gradient } from './calculus';

export type OptimizerId = 'gd' | 'momentum' | 'adam';

export interface OptState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mx: number;
  my: number;
  t: number;
}

export const initState = (x: number, y: number): OptState => ({ x, y, vx: 0, vy: 0, mx: 0, my: 0, t: 0 });

/**
 * One optimisation step. `grad` defaults to the numerical gradient of `f`.
 * Momentum uses beta=0.9; Adam uses beta1=0.9, beta2=0.999.
 */
export function step(
  id: OptimizerId,
  s: OptState,
  lr: number,
  f: Fn2,
  grad: (x: number, y: number) => [number, number] = (x, y) => gradient(f, x, y),
): OptState {
  const [gx, gy] = grad(s.x, s.y);
  const t = s.t + 1;
  switch (id) {
    case 'gd':
      return { ...s, x: s.x - lr * gx, y: s.y - lr * gy, t };
    case 'momentum': {
      const vx = 0.9 * s.vx + gx;
      const vy = 0.9 * s.vy + gy;
      return { ...s, x: s.x - lr * vx, y: s.y - lr * vy, vx, vy, t };
    }
    case 'adam': {
      const b1 = 0.9;
      const b2 = 0.999;
      const mx = b1 * s.mx + (1 - b1) * gx;
      const my = b1 * s.my + (1 - b1) * gy;
      const vx = b2 * s.vx + (1 - b2) * gx * gx;
      const vy = b2 * s.vy + (1 - b2) * gy * gy;
      const mxh = mx / (1 - b1 ** t);
      const myh = my / (1 - b1 ** t);
      const vxh = vx / (1 - b2 ** t);
      const vyh = vy / (1 - b2 ** t);
      return {
        x: s.x - (lr * mxh) / (Math.sqrt(vxh) + 1e-8),
        y: s.y - (lr * myh) / (Math.sqrt(vyh) + 1e-8),
        mx,
        my,
        vx,
        vy,
        t,
      };
    }
  }
}

export const rosenbrock: Fn2 = (x, y) => (1 - x) ** 2 + 100 * (y - x * x) ** 2;
