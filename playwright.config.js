import { defineConfig } from "@playwright/test";

/**
 * Drives the real app against the local Supabase stack (`npm run db:start`).
 *
 * Two servers, mirroring production: Vite on 5173 for the SPA, and the /api functions
 * on 3000 (Vite proxies /api → 3000, the same routing Vercel gives us).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false, // the specs share one database
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:api",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
