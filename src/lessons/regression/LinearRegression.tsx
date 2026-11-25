import { useState } from 'react';
import { LessonLayout } from '../../components/LessonLayout';
import { DragPoint, FnPath, Plot, Segment, usePlot } from '../../components/Plot';
import { Button, Controls, Slider, Stat, Stats, Tex, Toggle, fmt } from '../../components/ui';
import { leastSquares, mse, predict, type Point } from '../../lib/math/regression';
import { DEFAULT_POINTS } from './data';

export default function LinearRegression() {
  const [points, setPoints] = useState<Point[]>(DEFAULT_POINTS);
  const [w, setW] = useState(0.3);
  const [b, setB] = useState(0);
  const [showSquares, setShowSquares] = useState(true);
  const best = leastSquares(points);
  const loss = mse(points, w, b);

  return (
    <LessonLayout
      title="Linear regression"
      intro={
        <p>
          Linear regression models data with a straight line <Tex>{'\\hat y = wx + b'}</Tex>. The model
          learns by choosing the slope <Tex>w</Tex> and intercept <Tex>b</Tex> that make the errors (the{' '}
          <em>residuals</em>) as small as possible.
        </p>
      }
      explanation={
        <>
          <h3>Mean squared error</h3>
          <p>Each residual is squared, so large errors cost much more, and the squares are averaged:</p>
          <Tex block>{'\\text{MSE}(w,b)=\\frac{1}{n}\\sum_{i=1}^{n}\\big(wx_i+b-y_i\\big)^2'}</Tex>
          <p>
            The orange squares in the figure are those squared residuals drawn literally. The MSE is their
            average area.
          </p>
          <h3>The closed-form solution</h3>
          <p>For a straight line, calculus gives the best parameters directly:</p>
          <Tex block>{'w^*=\\frac{\\sum (x_i-\\bar x)(y_i-\\bar y)}{\\sum (x_i-\\bar x)^2},\\qquad b^*=\\bar y-w^*\\bar x'}</Tex>
          <p>
            Most ML models have no formula like this, so they are trained with{' '}
            <a href="#/regression/gradient-descent">gradient descent</a> instead.
          </p>
        </>
      }
      tryThis={[
        'Use the sliders to make the MSE as small as you can, then press "Show best fit" to compare.',
        'Drag one point far away (an outlier). Watch how strongly the best-fit line reacts: squaring makes MSE sensitive to outliers.',
        'Click on empty space to add points.',
      ]}
    >
      <Plot
        xDomain={[-5, 5]}
        yDomain={[-5, 8]}
        xLabel="x"
        yLabel="y"
        ariaLabel="Scatter plot with a regression line"
        onBackgroundClick={([x, y]) => setPoints((p) => [...p, { x, y }])}
      >
        {showSquares &&
          points.map((p, i) => <ResidualSquare key={`sq${i}`} p={p} yhat={predict(w, b, p.x)} />)}
        {points.map((p, i) => (
          <Segment key={`r${i}`} a={[p.x, p.y]} b={[p.x, predict(w, b, p.x)]} color="var(--c2)" />
        ))}
        <FnPath f={(x) => predict(best.w, best.b, x)} color="var(--muted)" dashed width={1.5} />
        <FnPath f={(x) => predict(w, b, x)} color="var(--c1)" />
        {points.map((p, i) => (
          <DragPoint
            key={i}
            x={p.x}
            y={p.y}
            r={6}
            color="var(--c3)"
            onChange={(x, y) => setPoints((ps) => ps.map((q, j) => (j === i ? { x, y } : q)))}
          />
        ))}
      </Plot>
      <Stats>
        <Stat label="Your MSE" value={fmt(loss)} color="var(--c1)" />
        <Stat label="Best MSE" value={fmt(mse(points, best.w, best.b))} />
        <Stat label={<Tex>{'w^*,\\;b^*'}</Tex>} value={`${fmt(best.w, 2)}, ${fmt(best.b, 2)}`} />
        <Stat label="Points" value={points.length} />
      </Stats>
      <Controls>
        <Slider label={<Tex>w</Tex>} value={w} min={-3} max={4} onChange={setW} />
        <Slider label={<Tex>b</Tex>} value={b} min={-4} max={5} onChange={setB} />
        <Toggle label="Show squared residuals" checked={showSquares} onChange={setShowSquares} />
        <div className="btn-row">
          <Button
            primary
            onClick={() => {
              setW(best.w);
              setB(best.b);
            }}
          >
            Show best fit
          </Button>
          <Button onClick={() => setPoints(DEFAULT_POINTS)}>Reset data</Button>
          <Button onClick={() => setPoints([])}>Clear points</Button>
        </div>
      </Controls>
    </LessonLayout>
  );
}

/** The squared residual drawn as a true square in screen space, to the right of the point. */
function ResidualSquare({ p, yhat }: { p: Point; yhat: number }) {
  const { x, y } = usePlot();
  const side = Math.abs(y(yhat) - y(p.y));
  return (
    <rect
      x={x(p.x)}
      y={Math.min(y(yhat), y(p.y))}
      width={side}
      height={side}
      fill="var(--c2)"
      fillOpacity={0.08}
      stroke="var(--c2)"
      strokeOpacity={0.5}
      strokeWidth={1}
    />
  );
}
