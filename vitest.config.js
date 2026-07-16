import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Loads .env.local so the RLS tests can reach the local Supabase. The "" prefix
    // means every var, not just VITE_ ones — the tests need the service-role key to
    // set up and tear down fixtures.
    // Playwright specs live in e2e/ and are driven by `npm run test:e2e`.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
});
