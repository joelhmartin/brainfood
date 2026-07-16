import { notFound } from "next/navigation";
import { BlogPostPage } from "../../../../src/screens/marketing/BlogPost.jsx";
import { getPosts, getPostBySlug, getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../../src/lib/metadata.js";
import { blogPostingSchema, breadcrumbSchema } from "../../../../src/lib/seo.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const settings = await getSettings();
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.image || undefined,
    type: "article",
    settings,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const [post, posts, settings] = await Promise.all([
    getPostBySlug(slug),
    getPosts(),
    getSettings(),
  ]);
  if (!post) notFound();

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${slug}` },
  ];

  return (
    <>
      {settings.seoIndexable && (
        <>
          <JsonLd data={blogPostingSchema(post, settings)} />
          <JsonLd data={breadcrumbSchema(crumbs, settings)} />
        </>
      )}
      <BlogPostPage post={post} posts={posts} />
    </>
  );
}
