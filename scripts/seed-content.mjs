/**
 * Seeds site settings and bootstrap content into Supabase.
 *
 * Upserts by slug. Re-running overwrites any dashboard edits to the seeded rows,
 * so this is a bootstrap tool for a fresh database, not a sync.
 *
 *   node scripts/seed-content.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.local).
 * Uses the service-role key because it must write before any admin exists.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { EVENTS, POSTS, SITE_SETTINGS } from "../supabase/seed-data.js";

// Minimal .env loader — avoids adding dotenv just for this script.
function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const [, key, value = ""] = match;
    if (process.env[key] === undefined) {
      process.env[key] = value.trim().replace(/^["']|["']$/g, "");
    }
  }
}

// fileURLToPath, not .pathname — the repo path contains a space, which .pathname
// hands back percent-encoded ("G-DRIVE%20SSD") and readFileSync cannot open.
loadEnv(fileURLToPath(new URL("../.env.local", import.meta.url)));

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Copy .env.example to .env.local and fill it in (see README-ADMIN.md).",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { error: settingsError } = await supabase
    .from("site_settings")
    .upsert(SITE_SETTINGS, { onConflict: "id" });
  if (settingsError) throw settingsError;
  console.log("✓ site settings");

  const { error: eventsError } = await supabase
    .from("events")
    .upsert(EVENTS, { onConflict: "slug" });
  if (eventsError) throw eventsError;
  console.log(`✓ ${EVENTS.length} events`);

  const { error: postsError } = await supabase
    .from("posts")
    .upsert(POSTS, { onConflict: "slug" });
  if (postsError) throw postsError;
  console.log(`✓ ${POSTS.length} posts`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
