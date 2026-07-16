import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/api/auth.js", async () => {
  const actual = await vi.importActual("../../../src/lib/api/auth.js");
  return { ...actual, requirePermission: vi.fn() };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { requirePermission } from "../../../src/lib/api/auth.js";
import { revalidatePath } from "next/cache";
import { POST } from "./route.js";

function request(body) {
  return {
    headers: new Headers({ authorization: "Bearer tok" }),
    json: () => (body === undefined ? Promise.reject(new SyntaxError("Unexpected end of JSON input")) : Promise.resolve(body)),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  requirePermission.mockResolvedValue({ id: "u1", role: "admin" });
});

describe("POST /api/revalidate", () => {
  it("revalidates the blog list and the post's own page", async () => {
    const response = await POST(request({ type: "post", slug: "my-post" }));

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).toHaveBeenCalledWith("/blog/my-post");
  });

  it("revalidates settings as a full layout refresh, with no slug", async () => {
    await POST(request({ type: "settings" }));

    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an unknown type with 400, not 500", async () => {
    const response = await POST(request({ type: "nonsense" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unknown type." });
  });

  // B1: a missing/malformed body used to throw SyntaxError out of `await request.json()`,
  // which errorResponse turned into a generic 500. The original endpoint's behavior
  // (and every other route here) is a real 400, not a crash.
  it("treats a missing/malformed body as a 400 'Unknown type', never a 500", async () => {
    const response = await POST(request(undefined));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unknown type." });
  });

  // B2: slug feeds directly into revalidatePath(); anything outside the whitelist is
  // stripped rather than trusted verbatim.
  it("strips a slug containing path-traversal or separator characters instead of passing it through", async () => {
    await POST(request({ type: "post", slug: "../../etc/passwd" }));

    expect(revalidatePath).toHaveBeenCalledWith("/blog");
    expect(revalidatePath).not.toHaveBeenCalledWith(expect.stringContaining(".."));
    expect(revalidatePath.mock.calls.map((c) => c[0])).not.toContain("/blog/../../etc/passwd");
  });

  it("accepts a normal slug shape untouched", async () => {
    await POST(request({ type: "event", slug: "spring-fundraiser-2026" }));

    expect(revalidatePath).toHaveBeenCalledWith("/events/spring-fundraiser-2026");
  });

  it("still requires CONTENT_PUBLISH — an unauthorized caller gets whatever requirePermission throws", async () => {
    const { HttpError } = await vi.importActual("../../../src/lib/api/auth.js");
    requirePermission.mockRejectedValue(new HttpError(403, "Not allowed."));

    const response = await POST(request({ type: "post" }));

    expect(response.status).toBe(403);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
