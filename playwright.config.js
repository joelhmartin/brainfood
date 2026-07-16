import { defineConfig } from "@playwright/test";

/**
 * Drives the real app against the local Supabase stack (`npm run db:start`).
 *
 * One server now: Next's own production server, which serves both the pages and the
 * /api route handlers from a single process (no more separate Vite + functions
 * servers — that split belonged to the old Vite/Vercel-dev-functions setup).
 *
 * Runs against a PRODUCTION build (`npm run build && npm start`), since that is what
 * actually deploys — `next dev` can mask bugs that only show up in the optimized build.
 *
 * Uses 127.0.0.1 with an explicit port rather than `localhost`/3000: this machine
 * resolves `localhost` to `::1` first and commonly has other projects already bound
 * to 3000/3001, so a fixed, explicit loopback address + port avoids both problems.
 */
const PORT = 3057;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false, // the specs share one database
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm start -- -p ${PORT} -H 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
