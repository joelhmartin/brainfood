import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The whole point of this build, exercised end to end:
 * sign in → create an event → publish it → see it on the public site → delete it.
 *
 * Runs against the local Supabase stack, so it verifies the real database, the real
 * RLS policies, and the real auth — not mocks.
 */

function loadEnv() {
  const path = fileURLToPath(new URL("../.env.local", import.meta.url));
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, value = ""] = match;
    if (process.env[key] === undefined) process.env[key] = value.trim();
  }
}
loadEnv();

const service = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const EMAIL = "e2e-admin@example.com";
const PASSWORD = "E2ePassword123!";
const TITLE = `E2E Test Event ${Date.now()}`;
// The app slugifies the title; the admin row carries it in data-event-row.
const SLUG = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, "-");

let userId;

test.beforeAll(async () => {
  const { data, error } = await service.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: "E2E Admin", role: "admin" },
  });
  if (error && !/already/i.test(error.message)) throw error;
  userId = data?.user?.id;
});

test.afterAll(async () => {
  await service.from("events").delete().eq("title", TITLE);
  if (userId) await service.auth.admin.deleteUser(userId);
});

async function signIn(page) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/app$/);
}

test("signed-out visitors are redirected away from the dashboard", async ({ page }) => {
  await page.goto("/app/events");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("rejects a wrong password", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill("definitely-not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("an admin can create, publish, and delete an event", async ({ page }) => {
  await signIn(page);

  // The dashboard should greet the admin and show the not-indexed warning.
  await expect(page.getByRole("heading", { name: /Welcome, E2E Admin/ })).toBeVisible();
  await expect(page.getByText(/hidden from Google/i)).toBeVisible();

  // ── create, as a draft ──
  await page.goto("/app/events");
  await page.getByRole("button", { name: "New Event" }).click();

  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Date").fill("2026-12-01");
  await page.getByLabel("Time").fill("9:00 AM");
  await page.getByLabel("Location").fill("Austin, TX");
  await page.getByLabel("Excerpt (short description)").fill("Created by the e2e test.");
  await page
    .getByLabel("Full Content (Markdown)")
    .fill("## What to expect\n\nA paragraph written by the end-to-end test.");
  await page.getByRole("button", { name: "Create Event" }).click();

  const row = page.locator(`[data-event-row="${SLUG}"]`);
  await expect(row).toBeVisible();
  await expect(row.getByText("Draft")).toBeVisible();

  // ── a draft must NOT be on the public site ──
  await page.goto("/events");
  await expect(page.getByText(TITLE)).toHaveCount(0);

  // ── publish it ──
  await page.goto("/app/events");
  await page.locator(`[data-event-row="${SLUG}"]`).getByTitle("Publish").click();
  await expect(page.getByText("Event published.")).toBeVisible();
  await expect(page.locator(`[data-event-row="${SLUG}"]`).getByText("Published")).toBeVisible();

  // ── now it IS on the public site ──
  await page.goto("/events");
  await expect(page.getByText(TITLE)).toBeVisible();

  // ── and its detail page renders the markdown body ──
  await page.goto(`/events/${SLUG}`);
  await expect(page.getByRole("heading", { name: TITLE })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What to expect" })).toBeVisible();
  await expect(page.getByText("A paragraph written by the end-to-end test.")).toBeVisible();

  // The excerpt is not shown on the page — it becomes the meta description.
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Created by the e2e test.",
  );

  // ── delete it ──
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/app/events");
  await page.locator(`[data-event-row="${SLUG}"]`).getByTitle("Delete").click();
  await expect(page.getByText("Event deleted.")).toBeVisible();

  await page.goto("/events");
  await expect(page.getByText(TITLE)).toHaveCount(0);
});

/**
 * The indexing switch is the highest-stakes setting on the site: with it off, every page
 * must tell Google to stay away, and structured data must NOT be emitted (it would be
 * describing a pre-launch domain as the real business listing). With it on, the reverse.
 */
test.describe("the search-engine indexing switch", () => {
  test.afterEach(async () => {
    await service.from("site_settings").update({ seo_indexable: false }).eq("id", 1);
  });

  test("noindexes every page and emits no structured data while OFF", async ({ page }) => {
    await service.from("site_settings").update({ seo_indexable: false }).eq("id", 1);

    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test("indexes pages and emits structured data once ON", async ({ page }) => {
    await service
      .from("site_settings")
      .update({ seo_indexable: true, site_url: "https://brainfoodrecovery.com" })
      .eq("id", 1);

    await page.goto("/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index, follow/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://brainfoodrecovery.com",
    );

    const orgLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    const org = JSON.parse(orgLd);
    expect(org["@type"]).toBe("ProfessionalService");
    // The seeded phone is blank; a fake one must never reach structured data.
    expect(org).not.toHaveProperty("telephone");

    // A published blog post carries BlogPosting markup.
    await page.goto("/blog/what-is-recovery-coaching");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = ld.map((t) => JSON.parse(t)["@type"]);
    expect(types).toContain("BlogPosting");
    expect(types).toContain("BreadcrumbList");
  });
});

test("shares a real Open Graph title and description", async ({ page }) => {
  await page.goto("/blog/what-is-recovery-coaching");

  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /What Is Recovery Coaching/,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page).toHaveTitle(/What Is Recovery Coaching/);
});

test("an unknown URL renders a 404 with noindex, rather than redirecting home", async ({
  page,
}) => {
  await page.goto("/this-page-does-not-exist");

  await expect(page.getByRole("heading", { name: /couldn't find that page/i })).toBeVisible();
  // The old behavior was <Navigate to="/" />, which told crawlers a dead URL was valid.
  await expect(page).toHaveURL(/this-page-does-not-exist/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
