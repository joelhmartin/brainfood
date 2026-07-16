import { describe, it, expect } from "vitest";
import { buildLoginRedirectUrl } from "./RequireAuth.jsx";
import { safeRedirectPath } from "../components/auth/LoginForm.jsx";
import { ROUTES } from "../config/routes.js";

/**
 * RequireAuth (producer) builds the `?from=` query param that LoginForm
 * (consumer) reads and validates with safeRedirectPath() before calling
 * router.replace(). These two used to disagree — RequireAuth passed
 * react-router `state`, which next/navigation has no equivalent of, so
 * redirect-back-after-login was a silent no-op. This test proves the full
 * round trip: build the URL, parse it the way LoginForm does, and confirm
 * safeRedirectPath() accepts the result rather than falling back to the
 * dashboard.
 */
describe("buildLoginRedirectUrl", () => {
  it("encodes a plain dashboard path into a ?from= query param", () => {
    expect(buildLoginRedirectUrl("/app")).toBe(`${ROUTES.LOGIN}?from=%2Fapp`);
  });

  it("encodes a nested dashboard path", () => {
    expect(buildLoginRedirectUrl("/app/settings")).toBe(
      `${ROUTES.LOGIN}?from=%2Fapp%2Fsettings`,
    );
  });

  it.each(["/app", "/app/settings", "/app/members", "/app/events", "/app/posts"])(
    "round-trips %s through safeRedirectPath without being rejected",
    (pathname) => {
      const redirectUrl = buildLoginRedirectUrl(pathname);

      // Mirror exactly what LoginForm does: parse `from` out of the query
      // string of the URL it lands on.
      const [, query] = redirectUrl.split("?");
      const from = new URLSearchParams(query).get("from");

      expect(safeRedirectPath(from)).toBe(pathname);
    },
  );

  it("still falls back to the dashboard if a malicious from ever reached safeRedirectPath", () => {
    // Not something buildLoginRedirectUrl itself would produce (it only ever
    // encodes usePathname()'s output), but confirms the consumer-side guard
    // is unaffected by this change.
    expect(safeRedirectPath("//evil.com")).toBe(ROUTES.DASHBOARD);
  });
});
