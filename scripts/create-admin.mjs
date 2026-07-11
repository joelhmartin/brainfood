/**
 * Creates the FIRST admin. Everyone after this one gets invited from the dashboard.
 *
 * Public sign-up is disabled (every user is an admin — an open signup endpoint would
 * let a stranger into the dashboard), so the first account has to be minted with the
 * service-role key.
 *
 *   node scripts/create-admin.mjs <email> [password]
 *
 * Omit the password and a strong one is generated and printed once.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

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

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const [email, passwordArg] = process.argv.slice(2);

if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email> [password]");
  process.exit(1);
}
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  process.exit(1);
}

// url-safe, ~128 bits
const password = passwordArg || randomBytes(18).toString("base64url");

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true, // no confirmation round-trip for the bootstrap account
  user_metadata: { name: email.split("@")[0], role: "admin" },
});

if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}

// The on_auth_user_created trigger creates the matching profile row.
console.log("\n✓ Admin created\n");
console.log(`  email:    ${email}`);
console.log(`  password: ${password}`);
console.log(`  user id:  ${data.user.id}`);
if (!passwordArg) {
  console.log("\n  Save this password now — it is not stored anywhere and won't be shown again.");
  console.log("  Change it from Settings after your first login.\n");
}
