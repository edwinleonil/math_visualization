import type { ReactNode } from 'react';

/**
 * Standard lesson shape: the explanation on the left (or on top on narrow screens),
 * the interactive figure on the right, and "try this" prompts underneath.
 */
export function LessonLayout({
  title,
  intro,
  children,
  explanation,
  tryThis,
}: {
  title: string;
  intro: ReactNode;
  /** The interactive figure and its controls. */
  children: ReactNode;
  /** Formulas and longer explanation. */
  explanation?: ReactNode;
  tryThis?: ReactNode[];
}) {
  return (
    <article className="lesson">
      <header>
        <h1>{title}</h1>
        <div className="intro">{intro}</div>
      </header>
      <div className="lesson-grid">
        <section className="figure">{children}</section>
        <aside className="explain">
          {explanation}
          {tryThis && tryThis.length > 0 && (
            <div className="try-this">
              <h3>Try this</h3>
              <ul>
                {tryThis.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
