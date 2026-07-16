import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

import { createClient } from "@supabase/supabase-js";
import { PERMISSIONS, ROLES } from "../../config/roles.js";

// auth.js reads SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY into module-scope consts at
// import time (matching the original api/_auth.js), and the test env's .env.local
// already provides real values for those vars. So every test resets the module
// registry and re-imports fresh after setting process.env itself — otherwise the
// module would silently keep whatever was captured on the very first import.
async function importAuth() {
  vi.resetModules();
  return import("./auth.js");
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
});

function request(authorization) {
  const headers = new Headers();
  if (authorization) headers.set("authorization", authorization);
  return { headers };
}

/**
 * Builds a fake Supabase admin client whose auth.getUser() and
 * profiles.select().eq().single() chain return the given results — this is the
 * exact chain requirePermission() calls, so a mock that ignores the shape
 * (e.g. a bare `single: () => ...` with no `.eq()`) would pass even if the real
 * `.eq("id", user.id)` filter were deleted from the implementation.
 */
function mockSupabase({ getUserResult, profileResult }) {
  const eqMock = vi.fn(() => ({ single: vi.fn(() => Promise.resolve(profileResult)) }));
  const client = {
    auth: { getUser: vi.fn(() => Promise.resolve(getUserResult)) },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: eqMock })) })),
  };
  createClient.mockReturnValue(client);
  return { client, eqMock };
}

describe("adminClient", () => {
  it("throws when SUPABASE_URL / SERVICE_ROLE_KEY are not configured", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { adminClient } = await importAuth();

    expect(() => adminClient()).toThrow(/not configured/);
  });

  it("creates a client with autoRefreshToken and persistSession disabled", async () => {
    createClient.mockReturnValue({});
    const { adminClient } = await importAuth();

    adminClient();

    expect(createClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "service-role-secret",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });
});

describe("requirePermission", () => {
  it("rejects a request with no Authorization header", async () => {
    const { requirePermission } = await importAuth();

    await expect(requirePermission(request(), PERMISSIONS.CONTENT_READ)).rejects.toMatchObject({
      status: 401,
      message: "Not signed in.",
    });
  });

  it("rejects a header that is not a Bearer token", async () => {
    const { requirePermission } = await importAuth();

    await expect(
      requirePermission(request("Basic abc123"), PERMISSIONS.CONTENT_READ),
    ).rejects.toMatchObject({ status: 401, message: "Not signed in." });
  });

  it("rejects an invalid or expired session", async () => {
    mockSupabase({ getUserResult: { data: { user: null }, error: new Error("bad token") } });
    const { requirePermission } = await importAuth();

    await expect(
      requirePermission(request("Bearer token"), PERMISSIONS.CONTENT_READ),
    ).rejects.toMatchObject({ status: 401, message: "Session is invalid or expired." });
  });

  it("rejects a valid session with no profile row", async () => {
    mockSupabase({
      getUserResult: { data: { user: { id: "u1" } }, error: null },
      profileResult: { data: null, error: new Error("not found") },
    });
    const { requirePermission } = await importAuth();

    await expect(
      requirePermission(request("Bearer token"), PERMISSIONS.CONTENT_READ),
    ).rejects.toMatchObject({ status: 403, message: "No profile for this account." });
  });

  it("rejects a role that lacks the permission — reads role from the profile, not the token", async () => {
    mockSupabase({
      getUserResult: { data: { user: { id: "u1" } }, error: null },
      profileResult: { data: { id: "u1", email: "a@b.com", name: "A", role: "editor" }, error: null },
    });
    const { requirePermission } = await importAuth();

    await expect(
      requirePermission(request("Bearer token"), PERMISSIONS.USERS_REMOVE),
    ).rejects.toMatchObject({ status: 403, message: "Not allowed." });
  });

  it("returns the profile when the role has the permission", async () => {
    const profile = { id: "u1", email: "a@b.com", name: "A", role: ROLES.ADMIN };
    const { eqMock } = mockSupabase({
      getUserResult: { data: { user: { id: "u1" } }, error: null },
      profileResult: { data: profile, error: null },
    });
    const { requirePermission } = await importAuth();

    const result = await requirePermission(request("Bearer token"), PERMISSIONS.CONTENT_READ);

    expect(result).toEqual(profile);
    // Confirms the lookup is actually scoped to the caller's id.
    expect(eqMock).toHaveBeenCalledWith("id", "u1");
  });

  it("strips the 'Bearer ' prefix before passing the token to getUser", async () => {
    const { client } = mockSupabase({
      getUserResult: { data: { user: { id: "u1" } }, error: null },
      profileResult: { data: { id: "u1", role: ROLES.ADMIN }, error: null },
    });
    const { requirePermission } = await importAuth();

    await requirePermission(request("Bearer abc.def.ghi"), PERMISSIONS.CONTENT_READ);

    expect(client.auth.getUser).toHaveBeenCalledWith("abc.def.ghi");
  });
});

describe("errorResponse", () => {
  it("passes through an HttpError's status and message", async () => {
    const { errorResponse, HttpError } = await importAuth();

    const response = errorResponse(new HttpError(403, "Not allowed."));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Not allowed." });
  });

  it("redacts a non-HttpError as a generic 500 and logs it, never leaking its message", async () => {
    const { errorResponse } = await importAuth();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = errorResponse(new Error("secret schema detail"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Something went wrong." });
    expect(spy).toHaveBeenCalledWith("[api]", expect.any(Error));

    spy.mockRestore();
  });
});
