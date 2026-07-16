/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROW LEVEL SECURITY — the actual security boundary.
 *
 * These tests hit a real Postgres (local Supabase, `npm run db:start`) using the
 * PUBLIC anon key — exactly what ships in the browser bundle and what an attacker
 * would use. They assert that the database refuses what the UI merely hides.
 *
 * If these pass, hiding a button in the UI is a convenience rather than the defence.
 * If they fail, the site is wide open no matter what React does.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = "rls-test-admin@example.com";
const ADMIN_PASSWORD = "RlsTestPassword123!";

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const service = createClient(URL, SERVICE, { auth: { persistSession: false } });

let adminClient;
let adminUserId;
let draftId;
let publishedId;

beforeAll(async () => {
  // An admin to test the authenticated side with.
  const { data: created, error } = await service.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { name: "RLS Test", role: "admin" },
  });
  if (error && !/already/i.test(error.message)) throw error;
  adminUserId = created?.user?.id;

  // Seed one draft and one published event via the service role (bypasses RLS).
  const { data: rows, error: seedError } = await service
    .from("events")
    .insert([
      {
        slug: `rls-draft-${Date.now()}`,
        title: "RLS Draft",
        date: "2026-09-01",
        published: false,
      },
      {
        slug: `rls-published-${Date.now()}`,
        title: "RLS Published",
        date: "2026-09-02",
        published: true,
      },
    ])
    .select();
  if (seedError) throw seedError;

  draftId = rows.find((r) => !r.published).id;
  publishedId = rows.find((r) => r.published).id;

  adminClient = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: signInError } = await adminClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (signInError) throw signInError;
});

afterAll(async () => {
  await service.from("events").delete().in("id", [draftId, publishedId]);
  if (adminUserId) await service.auth.admin.deleteUser(adminUserId);
});

describe("anonymous visitors", () => {
  it("can read published events", async () => {
    const { data } = await anon.from("events").select("id").eq("id", publishedId);
    expect(data).toHaveLength(1);
  });

  it("CANNOT read unpublished drafts", async () => {
    const { data } = await anon.from("events").select("id").eq("id", draftId);
    // RLS filters the row out rather than erroring — it simply does not exist for them.
    expect(data).toHaveLength(0);
  });

  it("CANNOT see drafts in an unfiltered select", async () => {
    const { data } = await anon.from("events").select("id, published");
    expect(data.every((row) => row.published)).toBe(true);
  });

  it("CANNOT insert an event", async () => {
    const { error } = await anon
      .from("events")
      .insert({ slug: "hacked", title: "Hacked", date: "2026-01-01" });
    expect(error).toBeTruthy();
  });

  it("CANNOT update an event", async () => {
    const { error, data } = await anon
      .from("events")
      .update({ title: "Defaced" })
      .eq("id", publishedId)
      .select();
    // Either an outright error, or zero rows matched — both mean the write did not land.
    expect(error || data?.length === 0).toBeTruthy();

    const { data: check } = await service.from("events").select("title").eq("id", publishedId);
    expect(check[0].title).toBe("RLS Published");
  });

  it("CANNOT delete an event", async () => {
    await anon.from("events").delete().eq("id", publishedId);
    const { data } = await service.from("events").select("id").eq("id", publishedId);
    expect(data).toHaveLength(1);
  });

  it("CANNOT read the profiles table", async () => {
    const { data, error } = await anon.from("profiles").select("email");
    expect(error || data?.length === 0).toBeTruthy();
  });

  it("can read site settings but CANNOT change them", async () => {
    const { data: read } = await anon.from("site_settings").select("name").eq("id", 1);
    expect(read).toHaveLength(1);

    await anon.from("site_settings").update({ seo_indexable: true }).eq("id", 1);
    const { data: check } = await service.from("site_settings").select("seo_indexable").eq("id", 1);
    expect(check[0].seo_indexable).toBe(false);
  });
});

describe("authenticated admins", () => {
  it("CAN read drafts", async () => {
    const { data } = await adminClient.from("events").select("id").eq("id", draftId);
    expect(data).toHaveLength(1);
  });

  it("CAN insert, update, and delete events", async () => {
    const slug = `rls-admin-${Date.now()}`;

    const { data: created, error: insertError } = await adminClient
      .from("events")
      .insert({ slug, title: "By Admin", date: "2026-10-01", published: false })
      .select()
      .single();
    expect(insertError).toBeNull();

    const { error: updateError } = await adminClient
      .from("events")
      .update({ title: "Renamed" })
      .eq("id", created.id);
    expect(updateError).toBeNull();

    const { error: deleteError } = await adminClient.from("events").delete().eq("id", created.id);
    expect(deleteError).toBeNull();

    const { data: gone } = await service.from("events").select("id").eq("id", created.id);
    expect(gone).toHaveLength(0);
  });

  it("CAN update site settings", async () => {
    const { error } = await adminClient
      .from("site_settings")
      .update({ tagline: "Set by RLS test" })
      .eq("id", 1);
    expect(error).toBeNull();
  });

  /**
   * Privilege escalation check. `role` is withheld by a column-level grant, so even a
   * legitimate signed-in admin cannot rewrite roles from the browser — that is what
   * keeps a future non-admin role from simply promoting itself.
   */
  it("CANNOT change their own role", async () => {
    await adminClient.from("profiles").update({ role: "superadmin" }).eq("id", adminUserId);

    const { data } = await service.from("profiles").select("role").eq("id", adminUserId);
    expect(data[0].role).toBe("admin");
  });
});
