import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface Lesson {
  /** URL path segment, unique within its section. */
  slug: string;
  title: string;
  summary: string;
  component: LazyExoticComponent<ComponentType>;
}

export interface Section {
  slug: string;
  title: string;
  lessons: Lesson[];
}

/**
 * The guided learning order. To add a lesson: create a component that renders
 * <LessonLayout>, then add an entry here.
 */
export const SECTIONS: Section[] = [
  {
    slug: 'linear-algebra',
    title: 'Linear algebra',
    lessons: [
      {
        slug: 'vectors',
        title: 'Vectors',
        summary: 'Arrows with direction and length; addition and scaling.',
        component: lazy(() => import('./linear-algebra/Vectors')),
      },
      {
        slug: 'dot-product',
        title: 'Dot product',
        summary: 'Measuring how aligned two vectors are, and projection.',
        component: lazy(() => import('./linear-algebra/DotProduct')),
      },
      {
        slug: 'matrix-transform',
        title: 'Matrices as transformations',
        summary: 'A 2×2 matrix bends space; the determinant scales area.',
        component: lazy(() => import('./linear-algebra/MatrixTransform')),
      },
      {
        slug: 'eigenvectors',
        title: 'Eigenvectors',
        summary: 'Directions that a matrix only stretches, never rotates.',
        component: lazy(() => import('./linear-algebra/Eigen')),
      },
    ],
  },
  {
    slug: 'calculus',
    title: 'Calculus',
    lessons: [
      {
        slug: 'derivative',
        title: 'Derivatives',
        summary: 'The slope of the tangent line, and the rate of change.',
        component: lazy(() => import('./calculus/Derivative')),
      },
      {
        slug: 'partial-derivatives',
        title: 'Partial derivatives',
        summary: 'Slicing a surface along one variable at a time.',
        component: lazy(() => import('./calculus/PartialDerivatives')),
      },
      {
        slug: 'gradient',
        title: 'The gradient',
        summary: 'The vector of partials, which points straight uphill.',
        component: lazy(() => import('./calculus/GradientField')),
      },
    ],
  },
  {
    slug: 'regression',
    title: 'Regression & optimisation',
    lessons: [
      {
        slug: 'linear-regression',
        title: 'Linear regression',
        summary: 'Fitting a line by minimising squared error.',
        component: lazy(() => import('./regression/LinearRegression')),
      },
      {
        slug: 'loss-surface',
        title: 'The loss surface',
        summary: 'Every model is a point; the loss is a landscape.',
        component: lazy(() => import('./regression/LossSurface')),
      },
      {
        slug: 'gradient-descent',
        title: 'Gradient descent',
        summary: 'Walking downhill one step at a time, and the learning rate.',
        component: lazy(() => import('./regression/GradientDescent')),
      },
      {
        slug: 'optimizers',
        title: 'Momentum & Adam',
        summary: 'Smarter steps for narrow valleys.',
        component: lazy(() => import('./regression/Optimizers')),
      },
    ],
  },
  {
    slug: 'probability-ml',
    title: 'Probability & ML',
    lessons: [
      {
        slug: 'distributions',
        title: 'Probability distributions',
        summary: 'Normal, uniform and Bernoulli; sampling and histograms.',
        component: lazy(() => import('./probability-ml/Distributions')),
      },
      {
        slug: 'logistic-regression',
        title: 'Logistic regression',
        summary: 'The sigmoid, decision boundaries and cross-entropy.',
        component: lazy(() => import('./probability-ml/LogisticRegression')),
      },
      {
        slug: 'activations',
        title: 'Activation functions',
        summary: 'ReLU, sigmoid and tanh, and their derivatives.',
        component: lazy(() => import('./probability-ml/Activations')),
      },
      {
        slug: 'overfitting',
        title: 'Overfitting',
        summary: 'Model complexity, and training vs test error.',
        component: lazy(() => import('./probability-ml/Overfitting')),
      },
    ],
  },
];

export const ALL_LESSONS = SECTIONS.flatMap((s) =>
  s.lessons.map((l) => ({ ...l, section: s, path: `/${s.slug}/${l.slug}` })),
);
