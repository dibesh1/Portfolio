import { useEffect, useRef } from 'react';

const MAX_PART_VW = 60; // how far each half travels apart at full scroll

export default function Hero() {
  const heroRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  // Scroll-driven banner split: at the top the halves sit centered; as you
  // scroll down through the hero they part to the left and right and fade;
  // scrolling back up brings them home. Transform/opacity only.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = heroRef.current;
    const l = leftRef.current;
    const r = rightRef.current;
    if (!hero || !l || !r) return;

    let raf = 0;
    let span = Math.max(hero.offsetHeight * 0.85, 1);
    const measure = () => { span = Math.max(hero.offsetHeight * 0.85, 1); };

    const update = () => {
      raf = 0;
      const p = Math.min(Math.max(window.scrollY / span, 0), 1); // 0 → 1
      const x = (p * MAX_PART_VW).toFixed(2);
      const op = (1 - p * 0.85).toFixed(3);
      l.style.transform = `translate3d(-${x}vw, 0, 0)`;
      r.style.transform = `translate3d(${x}vw, 0, 0)`;
      l.style.opacity = op;
      r.style.opacity = op;
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onResize = () => { measure(); onScroll(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      {/* Full-width portrait background (navy-toned via CSS). Tries the user's
          image files first, then falls back to the generated SVG. */}
      <figure className="hero__bg" aria-hidden="true">
        <img
          src="/hero-bg.jpg"
          alt=""
          loading="eager"
          fetchpriority="high"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget;
            const tried = Number(img.dataset.tried || 0);
            const next = ['/hero-bg.png', '/hero-bg.jpeg', '/hero-bg.webp', '/hero-bg.svg'][tried];
            if (next) {
              img.dataset.tried = String(tried + 1);
              img.src = next;
            } else {
              img.parentElement.style.display = 'none';
            }
          }}
        />
      </figure>
      <div className="wrap">
        <div className="hero__grid">
          <div>
            <span className="mono hero__eyebrow hero-anim">
              <span className="pulse" /> Available · London, UK
            </span>
            <h1 className="hero__banner">
              <span ref={leftRef} className="hero__banner-l hero-slide-l">Welcome to my site</span>
              <span ref={rightRef} className="hero__banner-r hero-slide-r">A creative Visionary</span>
            </h1>
          </div>

          <div className="hero__meta">
            <div className="hero-anim" data-delay="2">
              <span className="mono col-label">About</span>
              <p>
                Informatics Engineering graduate &amp; data analyst working at the intersection of{' '}
                <strong>SQL</strong>,{' '}
                <strong>Python</strong>, and end to end analytics, from
                preprocessing and ETL to dashboards and ML.
              </p>
            </div>
            <div className="hero-anim" data-delay="3">
              <span className="mono col-label">Stack</span>
              <p>Python · Pandas · NumPy · scikit-learn · SQL · PostgreSQL · MySQL · Power BI · Tableau · Excel · Laravel · Git</p>
            </div>
            <div className="hero-anim" data-delay="4">
              <span className="mono col-label">Languages</span>
              <p>English · Portuguese · Hindi · Nepali</p>
            </div>
          </div>

          <div className="hero__cta-row hero-anim hero-anim--rise" data-delay="5">
            <a href="#projects" className="btn btn--primary" data-magnetic>
              See selected work <span className="arrow">→</span>
            </a>
            <a href="/Dibesh_Oli_CV_DataAnalyst.pdf" className="btn btn--ghost" data-magnetic download>
              Download CV
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
