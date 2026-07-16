import { NotFoundPage } from "../src/screens/marketing/NotFound.jsx";
import { Navbar } from "../src/components/marketing/Navbar.jsx";
import { Footer } from "../src/components/marketing/Footer.jsx";
import { getSettings } from "../src/lib/content.server.js";
import { notFoundMetadata } from "../src/lib/metadata.js";

/**
 * Root-level 404 boundary.
 *
 * app/(marketing)/not-found.jsx (see that file) only renders when a page inside
 * the (marketing) route group calls notFound() — e.g. a future dynamic route
 * whose slug doesn't resolve. It does NOT catch a genuinely unmatched top-level
 * URL like /this-does-not-exist: Next can't tell which route group's layout
 * would have applied when no segment matches at all, so it falls back to this
 * root file (or its own unbranded built-in 404 if this file is absent). The old
 * React Router app had one catch-all `<Route path="*">` nested inside
 * MarketingLayout that covered both cases identically; replicating that here
 * means duplicating the Navbar/Footer wrapper at the root, since no nested
 * layout is mounted for a route that matches nothing.
 */
export async function generateMetadata() {
  const settings = await getSettings();
  return notFoundMetadata(settings);
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main>
        <NotFoundPage />
      </main>
      <Footer />
    </>
  );
}
