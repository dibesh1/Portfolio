import { lazy, Suspense, useEffect } from 'react';
import CustomCursor from './components/CustomCursor.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Experience from './components/Experience.jsx';
import SectionSkeleton from './components/SectionSkeleton.jsx';
import Footer from './components/Footer.jsx';
import { useReveal } from './hooks/useReveal.js';
import { useMagnetic } from './hooks/useMagnetic.js';

// Below-the-fold sections load as separate chunks after first paint.
const Projects = lazy(() => import('./components/Projects.jsx'));
const Contact = lazy(() => import('./components/Contact.jsx'));

/** Buttery in-page anchor scrolling for the nav links. */
function useAnchorSmoothScroll() {
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top, behavior: 'smooth' });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}

/** Thin accent line at the top that fills with scroll progress. */
function useScrollProgress() {
  useEffect(() => {
    const fill = document.getElementById('scroll-progress-fill');
    if (!fill) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      fill.style.transform = `scaleX(${p.toFixed(4)})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
}

/** Scroll-spy: lights the nav link for whichever section is centered. */
function useScrollSpy() {
  useEffect(() => {
    const ids = ['about', 'experience', 'projects', 'contact'];
    const links = new Map();
    ids.forEach((id) => {
      const l = document.querySelector(`.nav__link[href="#${id}"]`);
      if (l) links.set(id, l);
    });
    if (!links.size) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      let best = null;
      let bestDist = Infinity;
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = id; }
      });
      links.forEach((l, id) => l.classList.toggle('is-active', id === best));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    const settle = setTimeout(update, 400); // catch lazy sections once mounted
    update();
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}

export default function App() {
  useReveal();
  useMagnetic();
  useAnchorSmoothScroll();
  useScrollProgress();
  useScrollSpy();

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <span id="scroll-progress-fill" />
      </div>

      <div className="bg-grain" aria-hidden="true" />
      <div className="bg-noise" aria-hidden="true" />
      <CustomCursor />
      <Nav />
      <div id="scroll-content">
        <main id="top">
          <Hero />
          <About />
          <Experience />
          <Suspense fallback={<SectionSkeleton />}>
            <Projects />
            <Contact />
          </Suspense>
          <Footer />
        </main>
      </div>
    </>
  );
}
