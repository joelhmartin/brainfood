import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { BrandMotif } from "./BrandMotif.jsx";

/**
 * CtaBanner — the shared pink call-to-action panel (matches the home page CTA).
 * Self-contained: its own section wrapper, drifting brand motifs, and a
 * scroll-reveal on first view. Reused across Home and the service pages so the
 * closing CTA is identical everywhere.
 *
 * Props:
 *   eyebrow?    — small pill label above the heading
 *   title       — heading text (rendered in the heading face)
 *   titleAccent — trailing phrase rendered in the drama italic face
 *   subtitle?   — supporting line
 *   primary     — { label, to } for the solid white button
 *   secondary?  — { label, to } for the outline button
 */
export function CtaBanner({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  primary,
  secondary,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll("[data-cta-anim]");
    if (!targets.length) return;
    gsap.set(targets, { opacity: 0, y: 28 });
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: "power3.out",
          });
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-24 md:py-32">
      <div className="content-container">
        <div className="relative overflow-hidden rounded-4xl md:rounded-5xl bg-brand-500 p-10 md:p-16 text-center">
        <BrandMotif
          tone="light"
          className="bottom-[-6rem] left-[-4rem] w-80 opacity-10"
        />
        <BrandMotif
          tone="light"
          float="alt"
          className="hidden md:block top-[-5rem] right-[-3rem] w-64 opacity-[0.08]"
        />

        <div className="relative z-10">
          {eyebrow && (
            <div
              data-cta-anim
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/80 text-xs font-medium mb-6 tracking-wide"
            >
              {eyebrow}
            </div>
          )}
          <h2
            data-cta-anim
            className="font-heading font-bold text-3xl md:text-5xl text-white tracking-tight leading-tight max-w-2xl mx-auto"
          >
            {title}{" "}
            <span className="font-drama italic text-4xl md:text-6xl">
              {titleAccent}
            </span>
          </h2>
          {subtitle && (
            <p
              data-cta-anim
              className="mt-5 text-white/85 text-base md:text-lg max-w-xl mx-auto leading-relaxed"
            >
              {subtitle}
            </p>
          )}
          <div
            data-cta-anim
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Link
              to={primary.to}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors duration-300 shadow-lg"
            >
              {primary.label}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            {secondary && (
              <Link
                to={secondary.to}
                className="px-8 py-3.5 rounded-full border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-colors duration-300"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
