"use client";

import { useEffect } from "react";
import gsap from "gsap";

/**
 * Fades and lifts elements into view the first time their container is scrolled to.
 *
 * Uses IntersectionObserver rather than GSAP ScrollTrigger to avoid layout-shift
 * issues with externally loaded images.
 *
 * Extracted from identical copies that had been living in Home.jsx and
 * Contact.jsx. Both are now callers, so the reduced-motion handling below is
 * defined once instead of being a thing each screen could forget.
 *
 * @param {import("react").RefObject<HTMLElement>} ref  container to observe
 * @param {string} selector                             targets within the container
 * @param {{ y?: number, duration?: number, stagger?: number, ease?: string }} [animProps]
 */
export function useScrollReveal(ref, selector, animProps = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(selector);
    if (!targets.length) return;

    // Respect the OS-level "reduce motion" setting: show the content outright
    // rather than hiding it and animating it in. Skipping the animation but
    // keeping the `opacity: 0` would leave the section permanently invisible,
    // which is the failure mode worth guarding against.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    // Keep targets invisible until the observer fires
    gsap.set(targets, { opacity: 0, y: animProps.y ?? 24 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.to(targets, {
            opacity: 1,
            y: 0,
            duration: animProps.duration ?? 0.8,
            stagger: animProps.stagger ?? 0.08,
            ease: animProps.ease ?? "power3.out",
          });
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
}
