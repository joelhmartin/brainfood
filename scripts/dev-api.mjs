/**
 * Runs the /api functions locally on port 3000.
 *
 * Vite proxies /api → localhost:3000 (see vite.config.js), so `npm run dev:full`
 * gives the same routing locally that Vercel gives in production.
 *
 * This exists instead of `vercel dev` because vercel dev also wants to run Vite
 * itself, which means two dev servers fighting over the frontend. A 40-line shim is
 * less trouble.
 */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

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

loadEnv(join(ROOT, ".env.local"));

const { default: usersHandler } = await import("../api/users.js");
const { default: rebuildHandler } = await import("../api/rebuild.js");

const ROUTES = {
  "/api/users": usersHandler,
  "/api/rebuild": rebuildHandler,
};

/** Minimal shim of the Vercel request/response helpers the handlers rely on. */
function enhance(req, res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
    return res;
  };
  return { req, res };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const handler = ROUTES[url.pathname];

  enhance(req, res);

  if (!handler) {
    return res.status(404).json({ error: "Not found" });
  }

  // Vercel parses JSON bodies for you; node:http does not.
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString("utf8");
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      return res.status(400).json({ error: "Invalid JSON body." });
    }
  }

  try {
    await handler(req, res);
  } catch (err) {
    console.error("[dev-api]", err);
    if (!res.headersSent) res.status(500).json({ error: "Something went wrong." });
  }
});

server.listen(3000, () => {
  console.log("dev api  →  http://localhost:3000/api/{users,rebuild}");
});
