"use client";

import { useEffect, useRef, useState } from "react";

const LOADER_SRC = "https://cdn.trustindex.io/loader.js?c307643804302453cf2674fcfaa";

/**
 * Google-reviews badge from Trustindex (layout 111 — the avatars +
 * "5.0 Google · N reviews" pill), floated bottom-right on every page, and
 * bottom-centre below the `sm` breakpoint.
 *
 * The floating is ours, not Trustindex's. This widget is a `button` layout, and
 * the loader only self-attaches to `document.body` for its own `floating` /
 * `fomo` categories — so the fixed positioning lives on the host element here.
 * Switching the widget to a native floating layout in the Trustindex dashboard
 * would make this wrapper redundant.
 *
 * z-30 is deliberate: above page content (z-10 / z-20), below the mobile nav
 * overlay (z-40) and modals and toasts (z-50), so it never covers a dialog.
 *
 * The anchor node is built in an effect rather than rendered as JSX, because
 * the loader takes ownership of it: it stamps attributes on it, then replaces
 * it outright with the widget markup. Anything React server-renders here comes
 * back as a hydration mismatch, and `dangerouslySetInnerHTML` mismatches too
 * (React diffs the serialized `__html`). Creating the node post-hydration means
 * React never owns it and never diffs it.
 *
 * The anchor carries `data-src`, not `src` on a `<script>`, for two reasons:
 * React hoists `<script src>` out of the body into `<head>`, and the loader
 * refuses to render any non-floating layout at a tag inside `<head>`. Its
 * element scan matches `[data-src*="loader.js"]` just as happily.
 */
export function TrustindexBadge() {
  const host = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el || el.firstChild) return;

    // The loader lazy-loads on visibility and fills the anchor in whenever it
    // gets around to it, so the reveal is driven by the widget actually
    // landing in the DOM rather than by mount. Animating on mount would play
    // the transition against an empty box.
    const observer = new MutationObserver(() => {
      if (!el.querySelector(".ti-widget")) return;
      observer.disconnect();
      // One frame of the collapsed state first, or the browser coalesces the
      // insert and the class flip into a single paint and nothing animates.
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    });
    observer.observe(el, { childList: true, subtree: true });

    const anchor = document.createElement("div");
    anchor.setAttribute("data-src", LOADER_SRC);
    el.appendChild(anchor);

    // Three orderings to cover: the loader has already run (rescan for the
    // anchor we just added), it is still in flight (its own init scan will
    // find it), or it was never requested (request it).
    if (window.Trustindex?.loadWidgetsFromDom) {
      window.Trustindex.loadWidgetsFromDom();
    } else if (!document.querySelector(`script[src="${LOADER_SRC}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = LOADER_SRC;
      document.head.appendChild(script);
    }

    return () => observer.disconnect();
  }, []);

  // Positioning and animation are split across two elements on purpose: the
  // mobile centring and the reveal would both want the transform property, and
  // a flex-centred wrapper leaves `transform` free for the inner element.
  return (
    <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end pointer-events-none">
      <div
        ref={host}
        aria-hidden={!shown}
        className={[
          "origin-bottom scale-75 sm:origin-bottom-right sm:scale-100",
          "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
          shown ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-3",
        ].join(" ")}
      />
    </div>
  );
}
