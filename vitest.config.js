import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    environment: "node",
    // Loads .env.local so the RLS tests can reach the local Supabase. The "" prefix
    // means every var, not just VITE_ ones — the tests need the service-role key to
    // set up and tear down fixtures.
    env: loadEnv(mode ?? "test", process.cwd(), ""),
    // Playwright specs live in e2e/ and are driven by `npm run test:e2e`.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
}));
