import { useRef, useEffect, useCallback } from 'react';

const PROJECTS = [
  {
    num: '01',
    kind: 'Machine Learning',
    title: <>End-to-end <em>ML pipeline</em></>,
    desc: 'A complete ML workflow covering preprocessing, feature engineering, model training, and evaluation, built in Python with Pandas, NumPy, and scikit-learn. EDA in Matplotlib and Seaborn translated findings for non-technical stakeholders.',
    tags: ['Python', 'scikit-learn', 'EDA'],
    hue: 222,
  },
  {
    num: '02',
    kind: 'Full-stack',
    title: <>E-Shop <em>platform</em></>,
    desc: 'A full-stack e-commerce app with a relational database backend: catalog, cart, and checkout flow integrated via an SQL data layer, REST endpoints, and a responsive frontend.',
    tags: ['Laravel', 'MySQL', 'REST'],
    hue: 238,
  },
  {
    num: '03',
    kind: 'Web apps',
    title: <>Blog · Timetable · <em>Training</em></>,
    desc: 'Three production-shaped applications built with Laravel, React, and SQL databases, with clean schema design, CRUD APIs, and authentication flows.',
    tags: ['React', 'Laravel', 'Auth'],
    hue: 208,
  },
  {
    num: '04',
    kind: 'Fundamentals',
    title: <>Snake <em>game</em></>,
    desc: 'A classic Snake implementation focused on game logic and state management, a deliberate fundamentals exercise for reinforcing data structures and algorithmic thinking.',
    tags: ['JS', 'State', 'Algorithms'],
    hue: 252,
  },
  {
    num: '05',
    kind: 'Systems',
    title: <>Enterprise <em>infra ops</em></>,
    desc: 'Hands-on administration of servers, networks, and storage during my Durga role: patching, configuration, and uptime monitoring at production scale.',
    tags: ['Linux', 'Networking', 'Storage'],
    hue: 200,
  },
];

export default function Projects() {
  // Gentle 3D tilt + cursor-follow sheen (pointer devices, motion allowed).
  const allowTilt =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cursor slider: click-and-drag the row to slide through the cards.
  const scrollerRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0 });

  // Edge auto-scroll: rest the cursor near the left/right edge of the row and
  // the cards glide that way — speed ramps up the closer you get to the edge.
  const EDGE_ZONE = 110; // px from an edge where auto-scroll kicks in
  const MAX_SPEED = 16;  // px per frame at the very edge
  const edge = useRef({ vel: 0, raf: 0 });

  const stopEdge = useCallback(() => {
    edge.current.vel = 0;
    scrollerRef.current?.classList.remove('is-gliding');
    if (edge.current.raf) {
      cancelAnimationFrame(edge.current.raf);
      edge.current.raf = 0;
    }
  }, []);

  const stepEdge = useCallback(() => {
    const s = scrollerRef.current;
    const { vel } = edge.current;
    if (!s || vel === 0) { edge.current.raf = 0; return; }
    s.scrollLeft += vel;
    edge.current.raf = requestAnimationFrame(stepEdge);
  }, []);

  const onEdgeMove = useCallback((e) => {
    if (!allowTilt || drag.current.active) return; // pointer devices only, not while dragging
    const s = scrollerRef.current;
    if (!s) return;
    const r = s.getBoundingClientRect();
    const fromLeft = e.clientX - r.left;
    const fromRight = r.right - e.clientX;
    let vel = 0;
    if (fromLeft < EDGE_ZONE) vel = -MAX_SPEED * (1 - fromLeft / EDGE_ZONE);
    else if (fromRight < EDGE_ZONE) vel = MAX_SPEED * (1 - fromRight / EDGE_ZONE);
    edge.current.vel = vel;
    if (vel !== 0) {
      s.classList.add('is-gliding'); // suspend snap so the glide isn't yanked back
      if (!edge.current.raf) edge.current.raf = requestAnimationFrame(stepEdge);
    } else {
      s.classList.remove('is-gliding');
    }
  }, [allowTilt, stepEdge]);

  useEffect(() => stopEdge, [stopEdge]); // clean up on unmount

  const onDragStart = (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return; // touch keeps native scroll
    const s = scrollerRef.current;
    if (!s) return;
    stopEdge(); // drag takes over from edge auto-scroll
    drag.current = { active: true, startX: e.clientX, startLeft: s.scrollLeft };
    s.classList.add('is-dragging');
    try { s.setPointerCapture(e.pointerId); } catch {}
  };
  const onDragMove = (e) => {
    if (!drag.current.active) return;
    const s = scrollerRef.current;
    if (!s) return;
    s.scrollLeft = drag.current.startLeft - (e.clientX - drag.current.startX);
  };
  const onDragEnd = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    scrollerRef.current?.classList.remove('is-dragging');
  };

  const onTiltMove = (e) => {
    if (!allowTilt || drag.current.active) return; // no tilt while dragging
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = ((0.5 - py) * 6).toFixed(2);
    const ry = ((px - 0.5) * 6).toFixed(2);
    el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
  };
  const onTiltLeave = (e) => { e.currentTarget.style.transform = ''; };

  return (
    <section id="projects" className="cv-auto works">
      <div className="blend blend--top" aria-hidden="true" />
      <div className="wrap">
        <div className="section-head">
          <h2 className="reveal">Selected <em>work.</em></h2>
          <p className="reveal" data-delay="1">
            A handful of projects that show how I move from a messy dataset or vague brief to
            something usable. Move your cursor to either edge to glide through them — or grab and drag.
          </p>
        </div>

        <div className="works-viewport">
        <div
          className="works-scroller"
          data-stagger
          ref={scrollerRef}
          onPointerDown={onDragStart}
          onPointerMove={(e) => { onDragMove(e); onEdgeMove(e); }}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          onMouseLeave={stopEdge}
        >
          {PROJECTS.map((p, i) => (
            <article
              key={i}
              className="work-card reveal"
              style={{ '--hue': p.hue }}
              onMouseMove={onTiltMove}
              onMouseLeave={onTiltLeave}
            >
              <div className="work-card__top">
                <span className="work-card__index">{p.num}</span>
                <div className="work-card__tags">
                  {p.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>

              <span className="work-card__ghost" aria-hidden="true">{p.num}</span>

              <div className="work-card__foot">
                <span className="work-card__kind mono">{p.kind}</span>
                <h3 className="work-card__title">{p.title}</h3>
                <p className="work-card__desc">{p.desc}</p>
              </div>

              <span className="work-card__arrow" aria-hidden="true">→</span>
            </article>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
