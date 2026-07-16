import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/lib/api/auth.js", async () => {
  const actual = await vi.importActual("../../../src/lib/api/auth.js");
  return { ...actual, requirePermission: vi.fn(), adminClient: vi.fn() };
});

import { requirePermission, adminClient } from "../../../src/lib/api/auth.js";
import { POST, DELETE } from "./route.js";

function request(body) {
  return {
    headers: new Headers({ authorization: "Bearer tok", origin: "https://example.com" }),
    json: () => (body === undefined ? Promise.reject(new SyntaxError("Unexpected end of JSON input")) : Promise.resolve(body)),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  requirePermission.mockResolvedValue({ id: "u1", role: "admin" });
});

// B1: `await request.json()` used to throw a raw SyntaxError on a missing/malformed
// body, which errorResponse turns into a generic 500. The original api/users.js used
// `req.body ?? {}`, so a missing body produced a real 400 with actionable copy —
// these tests pin that behavior back in place.
describe("POST /api/users (inviteUser) — malformed body", () => {
  it("returns 400 with a validation message instead of a 500 when the body is missing/malformed", async () => {
    const response = await POST(request(undefined));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Enter a valid email address." });
  });
});

describe("DELETE /api/users (removeUser) — malformed body", () => {
  it("returns 400 with a validation message instead of a 500 when the body is missing/malformed", async () => {
    const response = await DELETE(request(undefined));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "userId is required." });
  });
});
