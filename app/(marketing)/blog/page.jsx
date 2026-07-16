import { BlogPage } from "../../../src/screens/marketing/Blog.jsx";
import { getPosts, getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

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
  const posts = await getPosts();
  return <BlogPage posts={posts} page={1} />;
}
