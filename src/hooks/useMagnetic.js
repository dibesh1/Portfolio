import { useEffect } from 'react';

/**
 * Magnetic hover effect for every [data-magnetic] element.
 * Uses document-level event delegation so elements mounted later
 * (React.lazy sections) work without re-binding. Transform-only.
 */
export function useMagnetic({ strength = 0.35, maxDist = 90 } = {}) {
  useEffect(() => {
    if (matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let current = null;

    const reset = () => {
      if (current) {
        current.style.transform = '';
        current = null;
      }
    };

    const onMove = (e) => {
      const el = e.target instanceof Element ? e.target.closest('[data-magnetic]') : null;

      if (el !== current) {
        reset();
        current = el;
      }
      if (!current) return;

      const r = current.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      const dist = Math.min(Math.hypot(dx, dy), maxDist);
      const angle = Math.atan2(dy, dx);
      current.style.transform = `translate3d(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px, 0)`;
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      reset();
    };
  }, [strength, maxDist]);
}
