import { describe, it, expect } from "vitest";
import { paginateEvents } from "./Events.jsx";
import { CONTENT } from "../../config/site.js";

/**
 * Builds a synthetic list of `count` published events, numbered so tests can
 * assert on exactly which ones landed on which page.
 */
function buildEvents(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    slug: `event-${i + 1}`,
    title: `Event ${i + 1}`,
    published: true,
    date: `2026-01-${String(i + 1).padStart(2, "0")}`,
  }));
}

describe("paginateEvents", () => {
  it("uses CONTENT.events.perPage (9) as the default page size", () => {
    expect(CONTENT.events.perPage).toBe(9);
  });

  it("page 1 shows the first 9 of 12 events", () => {
    const events = buildEvents(12);
    const { paginated, totalPages, currentPage } = paginateEvents(events, 1);

    expect(currentPage).toBe(1);
    expect(totalPages).toBe(2);
    expect(paginated).toHaveLength(9);
    expect(paginated.map((e) => e.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("page 2 shows the remaining 3 of 12 events", () => {
    const events = buildEvents(12);
    const { paginated, totalPages, currentPage } = paginateEvents(events, 2);

    expect(currentPage).toBe(2);
    expect(totalPages).toBe(2);
    expect(paginated).toHaveLength(3);
    expect(paginated.map((e) => e.id)).toEqual([10, 11, 12]);
  });

  it("page 1 and page 2 render DIFFERENT content — the exact duplicate-content regression this fix prevents", () => {
    const events = buildEvents(12);
    const page1 = paginateEvents(events, 1).paginated.map((e) => e.slug);
    const page2 = paginateEvents(events, 2).paginated.map((e) => e.slug);

    // No overlap between the two pages.
    const overlap = page1.filter((slug) => page2.includes(slug));
    expect(overlap).toEqual([]);
    // And they aren't both just "the full list" (the pre-fix bug).
    expect(page1).not.toEqual(page2);
    expect(page1.length + page2.length).toBe(events.length);
  });

  it("matches generateStaticParams' totalPages basis: raw event count / perPage, no featured carve-out", () => {
    // app/(marketing)/events/page/[page]/page.jsx computes:
    //   Math.ceil(events.length / CONTENT.events.perPage)
    // directly off the full events array with no carve-out. Confirm paginateEvents
    // agrees at a boundary count (exactly 2 full pages).
    const events = buildEvents(18);
    const { totalPages } = paginateEvents(events, 1);
    const routeBasis = Math.ceil(events.length / CONTENT.events.perPage);
    expect(totalPages).toBe(routeBasis);
    expect(totalPages).toBe(2);
  });

  it("with only 3 events (today's real count), there is exactly 1 page and it is unchanged", () => {
    const events = buildEvents(3);
    const { paginated, totalPages } = paginateEvents(events, 1);

    expect(totalPages).toBe(1);
    expect(paginated).toHaveLength(3);
    expect(paginated.map((e) => e.id)).toEqual([1, 2, 3]);
  });

  it("clamps a non-numeric or missing page down to page 1", () => {
    const events = buildEvents(12);
    expect(paginateEvents(events, undefined).currentPage).toBe(1);
    expect(paginateEvents(events, "not-a-number").currentPage).toBe(1);
    expect(paginateEvents(events, 0).currentPage).toBe(1);
  });
});
