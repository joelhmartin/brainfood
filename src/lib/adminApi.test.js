import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase.js", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

import { supabase } from "./supabase.js";
import { adminApi, revalidateContent } from "./adminApi.js";

function mockSession(token) {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: token ? { access_token: token } : null },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  global.fetch = vi.fn();
});

describe("adminApi", () => {
  it("still targets /api/users for listUsers/inviteUser/removeUser after the revalidate refactor", async () => {
    mockSession("tok");
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ users: [] }) });

    await adminApi.listUsers();

    expect(fetch).toHaveBeenCalledWith(
      "/api/users",
      expect.objectContaining({ method: "GET", headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
    );
  });
});

describe("revalidateContent", () => {
  it("POSTs to /api/revalidate with the caller's bearer token and a JSON body", async () => {
    mockSession("abc123");
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await revalidateContent("post", "my-slug");

    expect(fetch).toHaveBeenCalledWith("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer abc123" },
      body: JSON.stringify({ type: "post", slug: "my-slug" }),
    });
  });

  it("omits the slug when called for settings (no per-item page)", async () => {
    mockSession("abc123");
    fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) });

    await revalidateContent("settings");

    const [, init] = fetch.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ type: "settings", slug: undefined });
  });

  it("swallows a network failure instead of throwing — the save it follows already succeeded", async () => {
    mockSession("abc123");
    fetch.mockRejectedValue(new Error("network down"));
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(revalidateContent("post", "slug")).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith("[revalidate] failed:", expect.any(Error));
    warnSpy.mockRestore();
  });

  it("swallows a non-OK response (e.g. a lapsed session) instead of throwing", async () => {
    mockSession("abc123");
    fetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: "Not allowed." }) });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(revalidateContent("event", "x")).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("swallows the 'not signed in' error when there is no session at all", async () => {
    mockSession(null);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(revalidateContent("settings")).resolves.toBeUndefined();

    expect(fetch).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith("[revalidate] failed:", expect.any(Error));
    warnSpy.mockRestore();
  });
});
