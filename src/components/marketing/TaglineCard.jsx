import { BrandMotif } from "./BrandMotif.jsx";

/**
 * TaglineCard — the dark, motif-backed quote card used to feature a short
 * italic tagline (e.g. a service's promise) beside its intro copy.
 *
 * Sizing: on small screens the card grows to fit its content (with a minimum
 * height for presence) so long taglines are never clipped. From `md` up — where
 * the card is wide enough that any tagline fits — it locks to a fixed aspect
 * ratio for the proportioned look. This avoids the mobile clipping that a bare
 * `aspect-ratio` + `overflow-hidden` combination causes (overflow-hidden zeroes
 * the box's automatic min-height, so tall content is cut instead of expanding).
 *
 * Props:
 *   tagline   — the italic quote text
 *   label     — small uppercase eyebrow under the divider (e.g. service name)
 *   className — extra classes for the outer card (positioning, etc.)
 */
export function TaglineCard({ tagline, label, className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl flex items-center justify-center p-10 min-h-[16rem] md:min-h-0 md:aspect-[4/3] lg:aspect-[5/4] bg-gradient-to-br from-navy via-navy to-brand-950 shadow-2xl shadow-navy/20 ${className}`}
    >
      <BrandMotif
        tone="light"
        float="alt"
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[135%] max-w-none opacity-[0.08]"
      />
      <div className="relative z-10 text-center">
        <BrandMotif
          float={false}
          className="!static mx-auto w-14 mb-6 opacity-95"
        />
        <p className="font-drama italic text-2xl md:text-3xl text-white leading-snug text-balance">
          {tagline}
        </p>
        {label && (
          <>
            <div className="mt-6 mx-auto h-px w-12 bg-white/20" />
            <span className="mt-4 inline-block font-mono text-[11px] tracking-widest text-white/40 uppercase">
              {label}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
