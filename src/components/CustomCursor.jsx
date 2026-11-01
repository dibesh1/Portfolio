import { useEffect, useRef } from 'react';

// Elements the cursor ring should react to. Nav links/brand/CTA are all <a>,
// so `a` already covers them; `.work-card` and `.folder-tabs__tab` add the
// project gallery and experience tabs (the old `.project` class didn't exist).
const HOVER_SELECTOR = 'a, button, input, textarea, label, .tag, .work-card, .folder-tabs__tab';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    if (matchMedia('(hover: none)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;
    let running = false;

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform  = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      // Suspend once the ring has converged — zero rAF work while idle.
      if (Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e) => { mx = e.clientX; my = e.clientY; wake(); };
    const onOver = (e) => { if (e.target.closest(HOVER_SELECTOR)) ring.classList.add('is-hover'); };
    const onOut  = (e) => { if (e.target.closest(HOVER_SELECTOR)) ring.classList.remove('is-hover'); };

    addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
      <div className="cursor-dot"  ref={dotRef}  aria-hidden="true" />
    </>
  );
}
