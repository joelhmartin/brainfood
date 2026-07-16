// Test-only stand-in for the "server-only" package.
//
// The real package throws on import unless the bundler resolves the
// "react-server" export condition (which Next.js's build sets, but Vitest
// does not). Aliasing it to this empty module here mirrors what Next itself
// does for server components — see vitest.config.js — so modules that
// `import "server-only"` (e.g. src/lib/api/auth.js) can still be unit tested
// directly, while the real package still throws a build error for anyone who
// tries to bundle that module into client code.
export {};
