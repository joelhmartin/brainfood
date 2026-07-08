import { LOGOS } from "../../config/site.js";

/**
 * BrandMotif — the Brain Food icon used as a large, low-opacity decorative
 * accent that drifts slowly in the background. Purely ornamental (aria-hidden).
 *
 * Position and size are supplied by the caller via `className` (e.g.
 * "top-[-4rem] right-[-3rem] w-72 opacity-[0.05]"). Motion respects
 * prefers-reduced-motion (handled in index.css).
 *
 * tone:
 *   "natural" (default) — the icon's own rose/charcoal colors; for light bgs
 *   "light"             — white silhouette; for navy / photo backgrounds
 *   "charcoal"          — near-black silhouette; for subtle light-on-light marks
 *
 * float: "on" (default) drifts, "alt" drifts on an offset cycle, false is static.
 * fade:  when true, the mark fades out toward the bottom (gradient mask),
 *        so a top-anchored mark reads as a soft "hood" over the content
 *        instead of a hard clipped edge.
 */
export function BrandMotif({
  className = "",
  tone = "natural",
  float = "on",
  fade = false,
}) {
  const filter =
    tone === "light"
      ? "brightness(0) invert(1)"
      : tone === "charcoal"
      ? "brightness(0)"
      : undefined;

  const floatClass =
    float === "alt" ? "brand-float-alt" : float ? "brand-float" : "";

  const mask = fade
    ? "linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.85) 25%, transparent 50%)"
    : undefined;

  const style =
    filter || mask
      ? { filter, maskImage: mask, WebkitMaskImage: mask }
      : undefined;

  return (
    <img
      src={LOGOS.icon}
      alt=""
      aria-hidden="true"
      draggable="false"
      className={`pointer-events-none select-none absolute ${floatClass} ${className}`}
      style={style}
    />
  );
}
