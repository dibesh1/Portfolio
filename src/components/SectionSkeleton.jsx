/**
 * Lightweight skeleton shown while a lazy-loaded section's chunk fetches.
 * Shimmer runs on transform only (GPU-composited) — no layout work.
 */
export default function SectionSkeleton() {
  return (
    <section className="skeleton-section" aria-hidden="true">
      <div className="wrap">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton-grid">
          <div className="skeleton skeleton--card" />
          <div className="skeleton skeleton--card" />
        </div>
      </div>
    </section>
  );
}
