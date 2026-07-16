import { notFound } from "next/navigation";
import { BlogPage } from "../../../../../src/screens/marketing/Blog.jsx";
import { getPosts, getSettings } from "../../../../../src/lib/content.server.js";
import { buildMetadata } from "../../../../../src/lib/metadata.js";
import { CONTENT } from "../../../../../src/config/site.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  const pages = Math.ceil(posts.length / CONTENT.blog.perPage);
  // Page 1 lives at /blog, not /blog/page/1 — see blogPageUrl in config/site.js.
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const settings = await getSettings();
  return buildMetadata({
    title: `Blog — page ${page}`,
    description:
      "Practical writing on recovery coaching, daily habits, and supporting a loved one — from the team at Brain Food Recovery Services.",
    path: `/blog/page/${page}`,
    settings,
  });
}

export default async function Page({ params }) {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const posts = await getPosts();
  const totalPages = Math.ceil(posts.length / CONTENT.blog.perPage);
  if (pageNum > totalPages) notFound();

  return <BlogPage posts={posts} page={pageNum} />;
}
