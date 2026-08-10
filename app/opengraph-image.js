import { ImageResponse } from "next/og";
import { getSettings } from "../src/lib/content.server.js";

/**
 * Default social preview card (1200×630).
 *
 * Before this existed, `settings.ogImage` was null and buildMetadata emitted
 * `openGraph.images: undefined` — so every link shared to Facebook, LinkedIn,
 * Slack, or iMessage rendered as a bare text row with no image. That is the
 * same class of problem the Next migration fixed for crawlers, one layer up.
 *
 * This is the SITE-WIDE fallback. It does not override anything: routes that
 * pass a real `image` to buildMetadata (every blog post and event with cover
 * art) set `openGraph.images` explicitly, and an explicit value wins over the
 * file convention. So posts keep their own art and everything else stops
 * sharing blank.
 *
 * Drawn with layout primitives and no external asset on purpose — ImageResponse
 * has to fetch and inline any image or font file it references, and a remote
 * fetch here would make social previews fail whenever that fetch is slow or the
 * asset moves. Brand colors are the literal hex values from tailwind.config.js
 * (brand.500, navy, surface.100); ImageResponse never sees Tailwind, so they
 * cannot be referenced by class name.
 */
export const runtime = "nodejs";
export const alt = "Brain Food Recovery Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const settings = await getSettings();

  const name = settings.name || "Brain Food Recovery Services";
  const tagline =
    settings.tagline || settings.description || "Recovery coaching in Austin, Texas.";
  const location = [settings.city, settings.state].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#1d1a1a",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              backgroundColor: "#d85162",
              display: "flex",
            }}
          />
          <div
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {location || "Recovery Coaching"}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#FAF7F8",
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 28,
              color: "rgba(255,255,255,0.55)",
              fontSize: 32,
              lineHeight: 1.35,
              maxWidth: 860,
              display: "flex",
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 28,
          }}
        >
          <div style={{ color: "#d85162", fontSize: 24, fontWeight: 600, display: "flex" }}>
            {(settings.siteUrl || "").replace(/^https?:\/\//, "").replace(/\/$/, "") ||
              "bfrecovery.com"}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
