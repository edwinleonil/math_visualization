# ML Maths Visualiser

Interactive, visual lessons on the mathematics behind machine learning. Each lesson pairs a live figure (drag points, move sliders, press play) with a short explanation, the key formulas and "try this" prompts.

| Section | Lessons |
| --- | --- |
| 1. Linear algebra | Vectors · Dot product · Matrices as transformations · Eigenvectors |
| 2. Calculus | Derivatives · Partial derivatives · The gradient |
| 3. Regression & optimisation | Linear regression · The loss surface (2D and 3D) · Gradient descent · Momentum & Adam |
| 4. Probability & ML | Distributions · Logistic regression · Activation functions · Overfitting |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck and build a static site into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests for the maths library (Vitest) |
| `npm run lint` | ESLint |

## Project layout

```
src/
  App.tsx                 shell: sidebar, routing (HashRouter), theme, prev/next
  lessons/registry.ts     the ordered list of sections and lessons
  lessons/<section>/*.tsx one component per lesson
  components/
    Plot.tsx              SVG coordinate plane + primitives (FnPath, Arrow, DragPoint, Dot, ...)
    Contours.tsx          filled contour map of f(x, y) (d3-contour)
    Surface3D.tsx         3D surface (three.js, lazy-loaded)
    LessonLayout.tsx      standard lesson layout
    ui.tsx                Tex (KaTeX), Slider, Segmented, Stat, Button, useAnimationLoop
  lib/math/               pure, tested maths: linalg, calculus, regression, optimizers, prob, rng
```

### Adding a lesson

1. Create `src/lessons/<section>/MyLesson.tsx` with a default export that renders `<LessonLayout>`.
2. Build the figure from `<Plot>` and its primitives. Children read the scales with `usePlot()`.
3. Put any non-trivial maths in `src/lib/math/` and add a test to `math.test.ts`.
4. Register the lesson in `src/lessons/registry.ts`. Routing, the sidebar and prev/next pick it up automatically.

## Deploying

The build uses relative asset paths and hash routing, so `dist/` works on any static host. The included workflow `.github/workflows/deploy.yml` publishes to GitHub Pages on every push to `main`. To enable it, set **Settings → Pages → Source** to "GitHub Actions".
