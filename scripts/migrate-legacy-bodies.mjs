/**
 * One-time migration: rewrites `posts.body` / `events.body` rows that are still
 * in the legacy markdown-lite dialect as the HTML the dashboard editor now expects.
 *
 *   node scripts/migrate-legacy-bodies.mjs            # dry run — prints a diff, writes nothing
 *   node scripts/migrate-legacy-bodies.mjs --apply    # writes, after saving a backup
 *
 * Why this is needed even though ArticleBody converts markdown-lite at render time:
 * that fallback picks ONE path for the WHOLE body (`looksLikeHtml`). A legacy row
 * opened in the HTML editor renders correctly until the author inserts a single
 * snippet — at which point the body contains a tag, the legacy path switches off,
 * and every remaining "## " and "- " line silently renders as literal text.
 * Storing HTML removes the mixed state entirely.
 *
 * Idempotent: rows that already contain a tag are skipped, so re-running is a no-op.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.local).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { legacyToHtml, looksLikeHtml } from "../src/lib/content/legacyToHtml.js";
import { sanitizeHtml } from "../src/lib/content/sanitizeHtml.js";

// Minimal .env loader — matches scripts/seed-content.mjs rather than adding dotenv.
// fileURLToPath, not .pathname: the repo path contains a space, which .pathname
// hands back percent-encoded ("G-DRIVE%20SSD") and readFileSync cannot open.
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

loadEnv(fileURLToPath(new URL("../.env.local", import.meta.url)));

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

/**
 * The guarantee this migration has to make: the page must render exactly what it
 * rendered before. Both sides go through the same pipeline the site uses, then
 * whitespace between tags is collapsed, because pretty-printing is the one
 * difference that is allowed to exist.
 */
function rendersIdentically(before, after) {
  const collapse = (html) => sanitizeHtml(html).replace(/>\s+</g, "><").trim();
  return collapse(legacyToHtml(before)) === collapse(after);
}

const TABLES = ["posts", "events"];
const planned = [];
let skipped = 0;
let failed = 0;

// Pass 1 — read and convert everything, writing nothing.
for (const table of TABLES) {
  const { data, error } = await db.from(table).select("id, slug, body");
  if (error) {
    console.error(`${table}: read failed — ${error.message}`);
    process.exit(1);
  }

  console.log(`\n${table}: ${data.length} row(s)`);

  for (const row of data) {
    if (!row.body) {
      console.log(`  – ${row.slug}: empty body, skipped`);
      skipped += 1;
      continue;
    }
    if (looksLikeHtml(row.body)) {
      console.log(`  – ${row.slug}: already HTML, skipped`);
      skipped += 1;
      continue;
    }

    const html = legacyToHtml(row.body, { pretty: true });

    if (!rendersIdentically(row.body, html)) {
      console.error(`  ✗ ${row.slug}: converted HTML does not render identically — NOT migrated`);
      failed += 1;
      continue;
    }

    console.log(`  ✓ ${row.slug}: ${row.body.length} chars markdown-lite → ${html.length} chars HTML`);
    planned.push({ table, id: row.id, slug: row.slug, body: row.body, html });
  }
}

// Pass 2 — back up the originals to disk BEFORE the first write, so a write that
// fails halfway still leaves every original body recoverable.
if (apply && planned.length) {
  const path = fileURLToPath(new URL("../.legacy-bodies-backup.json", import.meta.url));
  writeFileSync(
    path,
    JSON.stringify(
      planned.map(({ table, id, slug, body }) => ({ table, id, slug, body })),
      null,
      2,
    ),
  );
  console.log(`\nBackup of original bodies: ${path}`);

  for (const row of planned) {
    const { error: writeError } = await db
      .from(row.table)
      .update({ body: row.html })
      .eq("id", row.id);
    if (writeError) {
      console.error(`  ✗ ${row.slug}: write failed — ${writeError.message}`);
      failed += 1;
    }
  }
}

console.log(
  `\n${apply ? "Migrated" : "Would migrate"} ${planned.length}, skipped ${skipped}, failed ${failed}.`,
);
if (!apply && planned.length) console.log("Re-run with --apply to write.");
process.exit(failed ? 1 : 0);
