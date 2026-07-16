import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "./LoginForm.jsx";
import { ROUTES } from "../../config/routes.js";

/**
 * `from` is attacker-controllable (it's a URL query param), so it must be
 * validated as a same-origin relative path before being handed to
 * router.replace(). See task-11-report.md for the open-redirect this closes.
 */
describe("safeRedirectPath", () => {
  it("allows a normal relative path", () => {
    expect(safeRedirectPath("/app/settings")).toBe("/app/settings");
  });

  it("rejects an absolute https URL and falls back to the dashboard", () => {
    expect(safeRedirectPath("https://evil.com")).toBe(ROUTES.DASHBOARD);
  });

  it("rejects an absolute http URL and falls back to the dashboard", () => {
    expect(safeRedirectPath("http://evil.com")).toBe(ROUTES.DASHBOARD);
  });

  it("rejects a protocol-relative URL (//evil.com) and falls back to the dashboard", () => {
    expect(safeRedirectPath("//evil.com")).toBe(ROUTES.DASHBOARD);
  });

  it("rejects a backslash-prefixed URL (/\\evil.com) and falls back to the dashboard", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe(ROUTES.DASHBOARD);
  });

  it("rejects a javascript: scheme and falls back to the dashboard", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBe(ROUTES.DASHBOARD);
  });

  it("falls back to the dashboard when from is null", () => {
    expect(safeRedirectPath(null)).toBe(ROUTES.DASHBOARD);
  });

  it("falls back to the dashboard when from is an empty string", () => {
    expect(safeRedirectPath("")).toBe(ROUTES.DASHBOARD);
  });
});
