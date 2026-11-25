import { Suspense, useEffect, useState } from 'react';
import { HashRouter, Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ALL_LESSONS, SECTIONS } from './lessons/registry';

type Theme = 'light' | 'dark' | 'system';

function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'system';
    } catch {
      return 'system';
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);
  return [theme, setTheme];
}

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="sidebar-nav" aria-label="Lessons">
      {SECTIONS.map((s, si) => (
        <div key={s.slug} className="nav-section">
          <div className="nav-section-title">
            <span className="nav-num">{si + 1}</span>
            {s.title}
          </div>
          <ul>
            {s.lessons.map((l) => (
              <li key={l.slug}>
                <NavLink to={`/${s.slug}/${l.slug}`} onClick={onNavigate}>
                  {l.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function PrevNext() {
  const { pathname } = useLocation();
  const i = ALL_LESSONS.findIndex((l) => l.path === pathname);
  if (i < 0) return null;
  const prev = ALL_LESSONS[i - 1];
  const next = ALL_LESSONS[i + 1];
  return (
    <div className="prev-next">
      {prev ? (
        <Link to={prev.path}>
          ← <span>{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link to={next.path} className="next">
          <span>{next.title}</span> →
        </Link>
      )}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Braces matter: newer Chromium returns a Promise from scrollTo, and React would treat it as a cleanup.
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Home() {
  return (
    <article className="home">
      <h1>The maths behind machine learning</h1>
      <p className="lede">
        Interactive, visual lessons on the linear algebra, calculus, optimisation and probability that machine
        learning is built on. Drag the points, move the sliders and watch the maths respond.
      </p>
      <div className="home-grid">
        {SECTIONS.map((s, si) => (
          <section key={s.slug} className="home-card">
            <h2>
              <span className="nav-num">{si + 1}</span>
              {s.title}
            </h2>
            <ul>
              {s.lessons.map((l) => (
                <li key={l.slug}>
                  <Link to={`/${s.slug}/${l.slug}`}>{l.title}</Link>
                  <span>{l.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p>
        <Link className="btn primary" to={ALL_LESSONS[0].path}>
          Start with vectors →
        </Link>
      </p>
    </article>
  );
}

export default function App() {
  const [theme, setTheme] = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  return (
    <HashRouter>
      <ScrollToTop />
      <div className={navOpen ? 'shell nav-open' : 'shell'}>
        <aside className="sidebar">
          <div className="brand-row">
            <Link to="/" className="brand" onClick={() => setNavOpen(false)}>
              <img src="./favicon.svg" alt="" width={24} height={24} />
              ML Maths
            </Link>
            <button className="nav-toggle" aria-label="Toggle navigation" onClick={() => setNavOpen((o) => !o)}>
              ☰
            </button>
          </div>
          <Sidebar onNavigate={() => setNavOpen(false)} />
          <div className="theme-picker">
            <label htmlFor="theme">Theme</label>
            <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value as Theme)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </aside>
        <main className="content">
          <Suspense fallback={<div className="loading">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              {ALL_LESSONS.map((l) => (
                <Route key={l.path} path={l.path} element={<l.component />} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <PrevNext />
        </main>
      </div>
    </HashRouter>
  );
}
