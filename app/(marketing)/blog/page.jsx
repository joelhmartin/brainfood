import { BlogPage } from "../../../src/screens/marketing/Blog.jsx";
import { getPosts, getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../src/lib/metadata.js";
import { breadcrumbSchema } from "../../../src/lib/seo.js";
import { CONTENT } from "../../../src/config/site.js";

export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Blog",
    description:
      "Practical writing on recovery coaching, daily habits, and supporting a loved one — from the team at Brain Food Recovery Services.",
    path: "/blog",
    settings,
  });
}

export default async function Page() {
  const [posts, settings] = await Promise.all([getPosts(), getSettings()]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: CONTENT.blog.label, path: CONTENT.blog.listPath },
  ];

  return (
    <>
      {settings.seoIndexable && <JsonLd data={breadcrumbSchema(crumbs, settings)} />}
      <BlogPage posts={posts} page={1} />
    </>
  );
}
