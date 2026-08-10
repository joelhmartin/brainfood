import { SitemapPage } from "../../../src/screens/marketing/Sitemap.jsx";
import { getPosts, getEvents, getSettings } from "../../../src/lib/content.server.js";
import { buildRouteSections } from "../../../src/config/routes.js";
import { buildMetadata, JsonLd } from "../../../src/lib/metadata.js";
import { breadcrumbSchema } from "../../../src/lib/seo.js";

// Same ISR window as the other content-driven routes: a new post should appear
// in the human sitemap on the same schedule it appears in the blog index.
export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Sitemap",
    description:
      "Every page on the Brain Food Recovery Services site — services, events, and articles — in one list.",
    path: "/sitemap",
    settings,
  });
}

export default async function Page() {
  const [posts, events, settings] = await Promise.all([getPosts(), getEvents(), getSettings()]);

  const sections = buildRouteSections({ posts, events });
  const totalCount = sections.reduce((sum, section) => sum + section.routes.length, 0);

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Sitemap", path: "/sitemap" },
  ];

  return (
    <>
      {settings.seoIndexable && <JsonLd data={breadcrumbSchema(crumbs, settings)} />}
      <SitemapPage sections={sections} totalCount={totalCount} />
    </>
  );
}
