import { useEffect } from 'react';

const STAGGER_STEP_MS = 45;

/**
 * Reveal-on-scroll, bidirectional.
 * - Reveals (.is-in) when an element is ~6% into the viewport — works whether
 *   you scroll DOWN into it or UP back into it.
 * - Resets only once the element is fully out of view, so you never see it
 *   animate out at the screen edge; it simply re-animates next time it enters.
 * - `[data-stagger]` containers cascade their `.reveal` children.
 * - A MutationObserver re-scans when lazy sections mount later.
 * Animations use opacity + transform only (compositor-friendly).
 */
export function useReveal() {
  useEffect(() => {
    const setIn = (el, on) => {
      if (el.hasAttribute('data-stagger')) {
        el.querySelectorAll('.reveal').forEach((child, i) => {
          child.style.transitionDelay = on ? `${i * STAGGER_STEP_MS}ms` : '0ms';
          child.classList.toggle('is-in', on);
        });
      } else {
        el.classList.toggle('is-in', on);
      }
    };

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-stagger]').forEach((c) => setIn(c, true));
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
      return;
    }

    const tracked = new WeakSet();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.06) {
            setIn(entry.target, true);          // entering (down or up)
          } else if (entry.intersectionRatio === 0) {
            setIn(entry.target, false);         // fully gone — reset for next time
          }
        });
      },
      { threshold: [0, 0.06, 0.25] }
    );

    const scan = () => {
      const containers = document.querySelectorAll('[data-stagger]');
      const staggeredChildren = new Set();
      containers.forEach((c) =>
        c.querySelectorAll('.reveal').forEach((el) => staggeredChildren.add(el))
      );
      containers.forEach((c) => {
        if (!tracked.has(c)) { tracked.add(c); io.observe(c); }
      });
      document.querySelectorAll('.reveal').forEach((el) => {
        if (!staggeredChildren.has(el) && !tracked.has(el)) { tracked.add(el); io.observe(el); }
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}
