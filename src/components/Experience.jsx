import { useEffect, useRef, useState } from 'react';
import { fetchExperience, fetchSkills } from '../lib/content.js';

// Fallback content, used until/unless Supabase data loads so the section
// always renders.
const FALLBACK_SKILLS = [
  {
    title: 'Data & Analysis',
    tags: ['SQL', 'Python', 'Pandas', 'NumPy', 'scikit-learn', 'ETL', 'EDA', 'A/B Testing'],
  },
  {
    title: 'Visualization',
    tags: ['Matplotlib', 'Seaborn', 'Power BI', 'Tableau', 'Excel · PivotTables'],
  },
  {
    title: 'Databases & Engineering',
    tags: ['PostgreSQL', 'MySQL', 'Schema Design', 'Query Optimization', 'Laravel ORM', 'Git'],
  },
  {
    title: 'Workflow & Soft Skills',
    tags: ['JIRA', 'Agile', 'GDPR', 'Stakeholder Comms', 'Multilingual'],
  },
];

const FALLBACK_ROLES = [
  {
    when: 'Dec 2023 — Nov 2024',
    tag: 'Now',
    title: 'Customer Support & Receptionist',
    org: 'Advocate Office — London',
    note: 'Multilingual (EN · PT · HI · NE)',
    current: true,
    bullets: [
      'Managed GDPR-compliant client records with zero data-protection incidents, via structured digital records, access controls, and weekly intake audits.',
      'Standardized a multilingual client-to-government workflow, cutting average case turnaround through live interpretation and reusable response templates.',
      'Accelerated front-desk throughput with a centralized scheduling log and prioritization rules for walk-in vs. booked clients.',
    ],
  },
  {
    when: 'Sep 2022 — Nov 2023',
    tag: '2023',
    title: 'Customer Service Representative',
    org: 'Cluster',
    bullets: [
      'Exceeded monthly response-time and CSAT KPIs by prioritizing high-impact tickets and following structured escalation paths.',
      'Documented an issue-resolution playbook across product categories with cross-functional teams, reducing average handle time.',
      'Delivered technical product support across daily contacts with empathetic, structured communication.',
    ],
  },
  {
    when: '2021',
    tag: '2021',
    title: 'Web Developer',
    org: 'Durga',
    bullets: [
      'Designed relational schemas with Laravel ORM — normalizing tables, indexing key columns, and rewriting inefficient SQL queries.',
      'Built scalable Laravel (MVC) web applications, translating business requirements into structured backend logic and reusable components.',
      'Administered servers, networks, and storage — configuration, patching, and uptime monitoring at production scale.',
    ],
  },
  {
    when: '2017',
    tag: '2017',
    title: 'Customer Support Representative',
    org: 'Tulsi',
    bullets: [
      'Resolved customer inquiries via email and chat within agreed SLAs using structured troubleshooting.',
      'Documented recurring issues into the internal FAQ and knowledge base, reducing repeat tickets.',
    ],
  },
  {
    when: '2018 — 2023',
    tag: 'BSc',
    title: 'BSc Informatics Engineering',
    org: 'IPB — Polytechnic Institute of Bragança, Portugal',
    bullets: [
      'Coursework: Databases, Algorithms & Data Structures, Statistics, Machine Learning, Software Engineering, OOP.',
    ],
  },
];

// Phase boundaries in 0..1 scroll progress. No enter dead zone: content is
// visible the instant you reach the section (so nav jumps don't land on a
// blank, and there's no empty gap scrolling in from the bio). Exit fades
// out near the end before Selected Work.
const PHASE_ENTER = 0;
const PHASE_EXIT  = 1; // no exit fade — last card holds until Selected Work (no empty seam)

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ease = (t) => 1 - Math.pow(1 - t, 3); // ease-out cubic

export default function Experience() {
  const stageRef = useRef(null);
  const stickyRef = useRef(null);
  const cardRefs = useRef([]);
  const tabsRef = useRef(null);
  const [active, setActive] = useState(0);
  // Live content from Supabase (published rows, ordered); falls back to the
  // built-in arrays on any error/empty result.
  const [roles, setRoles] = useState(FALLBACK_ROLES);
  const [skills, setSkills] = useState(FALLBACK_SKILLS);
  useEffect(() => {
    let alive = true;
    Promise.all([fetchExperience(), fetchSkills()]).then(([rolesData, skillsData]) => {
      if (!alive) return;
      if (rolesData?.length) {
        setRoles(
          rolesData.map((r) => ({
            when: r.period,
            tag: r.tag,
            title: r.title,
            org: r.org,
            note: r.note,
            current: r.is_current,
            bullets: r.bullets || [],
          }))
        );
      }
      if (skillsData?.length) {
        setSkills(skillsData.map((s) => ({ title: s.title, tags: s.tags || [] })));
      }
    });
    return () => { alive = false; };
  }, []);
  // Static mode: no scroll-flip pinning. Used on tablet/mobile (<=980px)
  // or when the user prefers reduced motion. Cards stack as a simple list.
  // Initialized synchronously so mobile never flashes hidden cards on mount.
  const [staticMode, setStaticMode] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 980px)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  );

  useEffect(() => {
    const mqSmall = matchMedia('(max-width: 980px)');
    const mqMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const compute = () => setStaticMode(mqSmall.matches || mqMotion.matches);
    compute();
    mqSmall.addEventListener('change', compute);
    mqMotion.addEventListener('change', compute);
    return () => {
      mqSmall.removeEventListener('change', compute);
      mqMotion.removeEventListener('change', compute);
    };
  }, []);

  // When switching to static mode, clear any inline styles the animated path
  // left behind (visibility/transform/opacity) so the CSS static rules apply
  // and every card shows in the stacked list.
  useEffect(() => {
    if (!staticMode) return;
    cardRefs.current.forEach((el) => { if (el) el.style.cssText = ''; });
    if (stickyRef.current) stickyRef.current.style.cssText = '';
  }, [staticMode]);

  useEffect(() => {
    if (staticMode) return;
    const stage = stageRef.current;
    const sticky = stickyRef.current;
    if (!stage || !sticky) return;

    let raf = 0;
    let inRange = true;   // stage near viewport — gates all work
    let stageTop = 0;
    let total = 1;
    const N = roles.length;

    // Measure once (and on resize) — never in the scroll hot path.
    const measure = () => {
      const rect = stage.getBoundingClientRect();
      stageTop = rect.top + window.scrollY;
      total = Math.max(stage.offsetHeight - window.innerHeight, 1);
    };
    measure();

    const update = () => {
      raf = 0;
      const p = clamp((window.scrollY - stageTop) / total, 0, 1); // 0 → 1

      // Section visible on enter; only a gentle fade-out near the end so it
      // hands off cleanly to Selected Work. Opacity + transform only.
      let sOpacity = 1, sScale = 1, sY = 0;
      if (p > PHASE_EXIT) {
        const t = ease((p - PHASE_EXIT) / (1 - PHASE_EXIT));
        sOpacity = lerp(1, 0, t);
        sScale   = lerp(1, 0.96, t);
        sY       = lerp(0, -30, t);
      }
      sticky.style.opacity   = sOpacity;
      sticky.style.transform = `translate3d(0, ${sY}px, 0) scale(${sScale})`;

      // Per-card flip-through.
      const midSpan = PHASE_EXIT - PHASE_ENTER;
      const mp = clamp((p - PHASE_ENTER) / midSpan, 0, 1);
      const idxFloat = mp * (N - 1);
      const activeIdx = Math.round(idxFloat);
      setActive((prev) => (prev === activeIdx ? prev : activeIdx));

      // Exactly ONE card is ever painted. The active card (the rounded index —
      // the same one the tab highlights, so they never desync) is visible and
      // fully opaque; every other card is hard-hidden with visibility:hidden so
      // no text can bleed through. The CSS transition on .folder-card gives the
      // active card a soft fade + scale-in; the outgoing one is cut instantly
      // behind it, so there is never a translucent overlap.
      for (let i = 0; i < N; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const isActive = i === activeIdx;
        el.style.visibility = isActive ? 'visible' : 'hidden';
        el.style.opacity = isActive ? '1' : '0';
        el.style.transform = isActive ? 'scale(1)' : 'scale(0.975)';
        el.style.zIndex = isActive ? '3' : '1';
        el.style.pointerEvents = isActive ? '' : 'none';
      }

      if (tabsRef.current) {
        tabsRef.current.style.setProperty('--active-x', `${(activeIdx / (N - 1)) * 100}%`);
      }
    };

    const schedule = () => { if (inRange && !raf) raf = requestAnimationFrame(update); };
    const onScroll = schedule;
    const onResize = () => { measure(); schedule(); };

    const io = new IntersectionObserver(
      ([entry]) => {
        inRange = entry.isIntersecting;
        if (inRange) { measure(); schedule(); }
      },
      { rootMargin: '60% 0px 60% 0px' }
    );
    io.observe(stage);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update(); // initial paint

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [staticMode, roles.length]);

  // Click a tab → highlight it and go to that role.
  const jumpTo = (i) => {
    setActive(i);
    // Static (mobile / reduced motion): cards are a stacked list — scroll to it.
    if (staticMode) {
      const card = cardRefs.current[i];
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // Pinned: scroll to the point in the stage where this card is active.
    const stage = stageRef.current;
    if (!stage) return;
    const N = roles.length;
    const midSpan = PHASE_EXIT - PHASE_ENTER;
    const targetMp = N > 1 ? i / (N - 1) : 0;
    const targetP = PHASE_ENTER + targetMp * midSpan;
    const stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const total = stage.offsetHeight - window.innerHeight;
    window.scrollTo({ top: stageTop + targetP * total, behavior: 'smooth' });
  };

  const stageHeight = `${(roles.length * 0.48 + 0.7) * 100}vh`; // restored pre-comment pacing

  return (
    <section id="experience" className="xp">
      <div
        ref={stageRef}
        className="xp-stage"
        style={{ height: staticMode ? 'auto' : stageHeight }}
      >
        <div ref={stickyRef} className={`xp-sticky${staticMode ? ' is-static' : ''}`}>
          <div className="wrap">
            <div className="section-head xp-head">
              <h2 className="reveal">Skills &amp; <em>experience.</em></h2>
              <p className="reveal" data-delay="1">
                What I work with, and the roles that shaped how I think about data and the people it serves.
              </p>
            </div>

            <div className="xp-grid">
              {/* LEFT — Skills */}
              <div className="xp-skills">
                <span className="mono xp-col-label reveal">Skills</span>
                <div className="skills" data-stagger>
                  {skills.map((block) => (
                    <div className="skill-block reveal" key={block.title}>
                      <h3>{block.title}</h3>
                      <div className="tag-row">
                        {block.tags.map((t) => (
                          <span className="tag" key={t}>{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — Experience folder (scaled down) */}
              <div className="xp-folder">
                <span className="mono xp-col-label reveal" data-delay="1">Experience</span>
                <div className="folder-shell">
                  <div className="folder-shell__lip" aria-hidden="true" />

                  <nav ref={tabsRef} className="folder-tabs" aria-label="Experience tabs">
                    {roles.map((r, i) => (
                      <button
                        key={i}
                        className={`folder-tabs__tab${active === i ? ' is-active' : ''}`}
                        onClick={() => jumpTo(i)}
                        data-magnetic
                      >
                        <span className="folder-tabs__num">{String(i + 1).padStart(2, '0')}</span>
                        <span className="folder-tabs__tag">{r.tag}</span>
                      </button>
                    ))}
                  </nav>

                  <div className="folder-deck" role="list">
                    {roles.map((r, i) => (
                      <article
                        key={i}
                        ref={(el) => (cardRefs.current[i] = el)}
                        className={`folder-card${r.current ? ' is-current' : ''}${staticMode ? ' is-static' : ''}`}
                        role="listitem"
                        aria-current={active === i ? 'true' : undefined}
                      >
                        <header className="folder-card__head">
                          <div className="folder-card__meta">
                            <span className="mono">{String(i + 1).padStart(2, '0')} / {String(roles.length).padStart(2, '0')}</span>
                            <span className="mono folder-card__when">{r.when}</span>
                            {r.current && <span className="folder-card__pill">Current</span>}
                          </div>
                          <h3 className="folder-card__title">{r.title}</h3>
                          <div className="folder-card__org">
                            {r.org}{r.note ? <span className="folder-card__note"> · {r.note}</span> : null}
                          </div>
                        </header>
                        <ul className="folder-card__list">
                          {r.bullets.map((b, j) => <li key={j}>{b}</li>)}
                        </ul>
                        <div className="folder-card__paper" aria-hidden="true" />
                      </article>
                    ))}
                  </div>

                  {!staticMode && (
                    <div className="folder-progress" aria-hidden="true">
                      <span className="mono">
                        {String(active + 1).padStart(2, '0')} &nbsp;/&nbsp; {String(roles.length).padStart(2, '0')}
                      </span>
                      <span className="folder-progress__hint mono">Scroll to flip through</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
