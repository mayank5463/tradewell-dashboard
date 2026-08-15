/**
 * PageIcon
 * ------------------------------------------------------------
 * Renders one of the 5 line-art PNGs (src/assets/icons/) as a
 * colored, theme-aware chip using CSS mask-image. Because the
 * source PNGs are transparent black line art, masking them lets
 * the icon take on `background: var(--page-icon-<tone>)` from
 * icons.css — so it's never a flat black pixel image that goes
 * invisible in dark mode. Same component, 5 icons, 4 themes,
 * 2 modes — one code path.
 *
 * Usage:
 *   <PageIcon src={iconHoldings} tone="holdings" size="lg" />
 */
export default function PageIcon({ src, tone = "holdings", size = "md", className = "" }) {
  return (
    <span className={`page-icon page-icon--${tone} page-icon--${size} ${className}`}>
      <span
        className="page-icon__mask"
        style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }}
        role="img"
        aria-hidden="true"
      />
    </span>
  );
}