import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      // The real "server-only" package (imported by src/lib/api/auth.js) throws on
      // import unless the bundler resolves the "react-server" export condition —
      // Next.js's build sets that condition, Vitest does not. Alias it to a no-op
      // stub so the module stays unit-testable; the real package still throws for
      // anyone who bundles it into client code, which is the protection it's for.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.js", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Loads .env.local so the RLS tests can reach the local Supabase. The "" prefix
    // means every var, not just VITE_ ones — the tests need the service-role key to
    // set up and tear down fixtures.
    // Playwright specs live in e2e/ and are driven by `npm run test:e2e`.
    env: loadEnv(mode ?? "test", process.cwd(), ""),
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
}));
