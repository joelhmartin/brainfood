import { describe, it, expect } from "vitest";
import { paginatePosts } from "./Blog.jsx";
import { CONTENT } from "../../config/site.js";

/**
 * Builds a synthetic list of `count` published posts, numbered so tests can
 * assert on exactly which ones landed on which page. Dates descend (P1 is
 * newest) to match BlogPage's own sort (`new Date(b.date) - new Date(a.date)`).
 * `featuredId`, if given, flags that post as the page-1 hero.
 */
function buildPosts(count, featuredId) {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    return {
      id,
      slug: `post-${id}`,
      title: `Post ${id}`,
      category: "General",
      published: true,
      featured: id === featuredId,
      date: `2026-01-${String(count - i).padStart(2, "0")}`,
    };
  });
}

describe("paginatePosts", () => {
  it("uses CONTENT.blog.perPage (6) as the default page size", () => {
    expect(CONTENT.blog.perPage).toBe(6);
  });

  it("page 1 shows the first 6 of 13 posts", () => {
    const posts = buildPosts(13);
    const { paginated, totalPages, currentPage } = paginatePosts(posts, 1);

    expect(currentPage).toBe(1);
    expect(totalPages).toBe(3);
    expect(paginated).toHaveLength(6);
    expect(paginated.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("page 2 shows the next 6 of 13 posts", () => {
    const posts = buildPosts(13);
    const { paginated, totalPages, currentPage } = paginatePosts(posts, 2);

    expect(currentPage).toBe(2);
    expect(totalPages).toBe(3);
    expect(paginated).toHaveLength(6);
    expect(paginated.map((p) => p.id)).toEqual([7, 8, 9, 10, 11, 12]);
  });

  it("page 3 shows the remaining 1 of 13 posts", () => {
    const posts = buildPosts(13);
    const { paginated, totalPages, currentPage } = paginatePosts(posts, 3);

    expect(currentPage).toBe(3);
    expect(totalPages).toBe(3);
    expect(paginated.map((p) => p.id)).toEqual([13]);
  });

  it("matches generateStaticParams' totalPages basis: raw post count / perPage, no featured carve-out", () => {
    // app/(marketing)/blog/page/[page]/page.jsx computes:
    //   Math.ceil(posts.length / CONTENT.blog.perPage)
    // directly off the full posts array with no carve-out. Confirm paginatePosts
    // agrees at a boundary count (exactly 2 full pages).
    const posts = buildPosts(12);
    const { totalPages } = paginatePosts(posts, 1);
    const routeBasis = Math.ceil(posts.length / CONTENT.blog.perPage);
    expect(totalPages).toBe(routeBasis);
    expect(totalPages).toBe(2);
  });

  it("clamps a non-numeric or missing page down to page 1", () => {
    const posts = buildPosts(13);
    expect(paginatePosts(posts, undefined).currentPage).toBe(1);
    expect(paginatePosts(posts, "not-a-number").currentPage).toBe(1);
    expect(paginatePosts(posts, 0).currentPage).toBe(1);
  });

  it("with only 3 posts (today's real count), there is exactly 1 page and it is unchanged", () => {
    const posts = buildPosts(3, 2);
    const { paginated, totalPages } = paginatePosts(posts, 1);

    expect(totalPages).toBe(1);
    expect(paginated).toHaveLength(3);
    expect(paginated.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  /**
   * THE DISCRIMINATING TEST — this is the exact bug described in the final
   * review: with a featured post carved out of page 1 only, the OLD basis
   * (`Math.ceil(filtered.length / perPage)` where `filtered` excludes the
   * featured post on page 1 but NOT on later pages) disagrees with itself
   * from page to page, which both duplicates and orphans posts.
   *
   * 13 published posts, post #3 (by id) is featured. perPage = 6.
   *
   * OLD (buggy) basis, replicated here for the record:
   *   page 1: rest = all-but-#3 (12 items) -> totalPages = ceil(12/6) = 2,
   *           paginated = rest.slice(0,6) = [1,2,4,5,6,7]
   *   page 2: rest = all 13 (carve only applies on page 1) -> totalPages = ceil(13/6) = 3,
   *           paginated = rest.slice(6,12) = [7,8,9,10,11,12]
   *   -> totalPages disagrees between the two pages (2 vs 3), and post #7
   *      appears on BOTH page 1 and page 2.
   *
   * This test asserts the FIXED invariants that make that impossible:
   *   1. totalPages is identical no matter which page you ask from, and
   *      matches the route's raw-count basis.
   *   2. Walking every page's raw slice covers each post exactly once (no
   *      duplicates, no gaps) — the featured post is a page-1 display
   *      overlay, never a change to which posts land on which page.
   */
  it("does not duplicate or orphan posts when a featured post exists (regression for the Events-style pagination bug)", () => {
    const posts = buildPosts(13, 3);
    const perPage = CONTENT.blog.perPage;
    const routeBasis = Math.ceil(posts.length / perPage);

    const page1 = paginatePosts(posts, 1);
    const page2 = paginatePosts(posts, 2);
    const page3 = paginatePosts(posts, 3);

    // Every page must agree with the route's own totalPages computation.
    expect(page1.totalPages).toBe(routeBasis);
    expect(page2.totalPages).toBe(routeBasis);
    expect(page3.totalPages).toBe(routeBasis);
    expect(routeBasis).toBe(3);

    // Concatenating every page's raw slice must reconstruct the full,
    // unduplicated post list exactly once each.
    const allIds = [...page1.paginated, ...page2.paginated, ...page3.paginated].map((p) => p.id);
    expect(allIds).toEqual(posts.map((p) => p.id));

    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(posts.length);
  });

  it("at 7 posts (one past a full page), the 7th post is reachable and not orphaned", () => {
    // Milder version of the same bug: with a featured post on page 1, the old
    // basis computed totalPages=1 from a 6-item `filtered` and rendered no
    // pagination at all, even though generateStaticParams (raw-count based)
    // prerenders /blog/page/2 for the 7th post.
    const posts = buildPosts(7, 2);
    const perPage = CONTENT.blog.perPage;
    const routeBasis = Math.ceil(posts.length / perPage);

    const { totalPages } = paginatePosts(posts, 1);
    expect(totalPages).toBe(routeBasis);
    expect(totalPages).toBe(2);

    const page2 = paginatePosts(posts, 2);
    expect(page2.paginated.map((p) => p.id)).toEqual([7]);
  });
});
