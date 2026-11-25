import { describe, expect, it } from 'vitest';
import { angleBetween, det, eigen2, matVec, project, type Mat2 } from './linalg';
import { derivative, gradient } from './calculus';
import { leastSquares, linearDataset, mse, mseGrad, polyEval, polyFit } from './regression';
import { initState, rosenbrock, step } from './optimizers';
import { bce, normalPdf, sigmoid, uniformPdf } from './prob';

describe('linalg', () => {
  it('projects and measures angles', () => {
    expect(project([2, 2], [1, 0])).toEqual([2, 0]);
    expect(angleBetween([1, 0], [0, 3])).toBeCloseTo(Math.PI / 2);
  });

  it('finds eigenpairs satisfying Av = lambda v', () => {
    const mats: Mat2[] = [
      [[2, 1], [1, 2]],
      [[3, 0], [0, 1]],
      [[1, 2], [0, 3]],
      [[2, 0], [0, 2]],
    ];
    for (const m of mats) {
      const eig = eigen2(m);
      expect(eig.length).toBeGreaterThan(0);
      for (const { value, vector } of eig) {
        const Av = matVec(m, vector);
        expect(Av[0]).toBeCloseTo(value * vector[0]);
        expect(Av[1]).toBeCloseTo(value * vector[1]);
      }
    }
    expect(eigen2([[0, -1], [1, 0]])).toEqual([]); // rotation: complex eigenvalues
    expect(det([[2, 1], [1, 2]])).toBe(3);
  });
});

describe('calculus', () => {
  it('matches analytic derivatives', () => {
    expect(derivative((x) => x ** 3, 2)).toBeCloseTo(12, 4);
    const [gx, gy] = gradient((x, y) => x * x + 3 * x * y, 1, 2);
    expect(gx).toBeCloseTo(8, 4);
    expect(gy).toBeCloseTo(3, 4);
  });
});

describe('regression', () => {
  const pts = linearDataset(50, 1.5, -0.5, 0.3, 7);

  it('analytic MSE gradient matches finite differences', () => {
    const [gw, gb] = mseGrad(pts, 0.2, 0.7);
    const [nw, nb] = gradient((w, b) => mse(pts, w, b), 0.2, 0.7);
    expect(gw).toBeCloseTo(nw, 3);
    expect(gb).toBeCloseTo(nb, 3);
  });

  it('gradient descent converges to the closed-form solution', () => {
    const { w, b } = leastSquares(pts);
    let s = initState(0, 0);
    for (let i = 0; i < 2000; i++) s = step('gd', s, 0.02, () => 0, (x, y) => mseGrad(pts, x, y));
    expect(s.x).toBeCloseTo(w, 3);
    expect(s.y).toBeCloseTo(b, 3);
  });

  it('fits polynomials exactly when the data is polynomial', () => {
    const data = [-2, -1, 0, 1, 2, 3].map((x) => ({ x, y: 1 - 2 * x + 0.5 * x * x }));
    const c = polyFit(data, 2);
    expect(polyEval(c, 4)).toBeCloseTo(1 - 8 + 8, 4);
  });
});

describe('optimizers', () => {
  it('Adam makes progress on Rosenbrock', () => {
    let s = initState(-1.5, 2);
    const start = rosenbrock(s.x, s.y);
    for (let i = 0; i < 500; i++) s = step('adam', s, 0.05, rosenbrock);
    expect(rosenbrock(s.x, s.y)).toBeLessThan(start / 10);
  });
});

describe('probability', () => {
  const integrate = (f: (x: number) => number, a: number, b: number, n = 20000) => {
    const h = (b - a) / n;
    let s = 0;
    for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h) * h;
    return s;
  };

  it('PDFs integrate to about 1', () => {
    expect(integrate((x) => normalPdf(x, 1, 0.7), -10, 10)).toBeCloseTo(1, 4);
    expect(integrate((x) => uniformPdf(x, -1, 2), -5, 5)).toBeCloseTo(1, 3);
  });

  it('sigmoid and BCE behave', () => {
    expect(sigmoid(0)).toBe(0.5);
    expect(bce(1, 0.999)).toBeLessThan(0.01);
    expect(bce(1, 0.001)).toBeGreaterThan(6);
  });
});
