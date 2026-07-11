import { describe, it, expect } from "vitest";
import { ROLES, PERMISSIONS, roleCan, permissionsForRole, isValidRole } from "./roles.js";

describe("roles", () => {
  it("grants an admin every permission", () => {
    for (const permission of Object.values(PERMISSIONS)) {
      expect(roleCan(ROLES.ADMIN, permission)).toBe(true);
    }
  });

  it("denies everything to an unknown or missing role", () => {
    expect(roleCan("editor", PERMISSIONS.CONTENT_WRITE)).toBe(false);
    expect(roleCan(undefined, PERMISSIONS.CONTENT_READ)).toBe(false);
    expect(roleCan(null, PERMISSIONS.USERS_INVITE)).toBe(false);
  });

  it("denies an unknown permission even to an admin", () => {
    expect(roleCan(ROLES.ADMIN, "billing:refund")).toBe(false);
  });

  it("returns an empty permission list for an unknown role", () => {
    expect(permissionsForRole("nobody")).toEqual([]);
  });

  it("validates roles", () => {
    expect(isValidRole("admin")).toBe(true);
    expect(isValidRole("owner")).toBe(false);
  });

  /**
   * The bug this replaces: the old hasPermission() was called with an ARRAY of
   * permissions where it expected a ROLE string, so it looked up PERMISSIONS[array],
   * got undefined, and returned false for everything — silently hiding the Members
   * link, the Settings link, and the Invite button.
   */
  it("takes a role, not a permissions array", () => {
    const permissions = permissionsForRole(ROLES.ADMIN);
    expect(roleCan(permissions, PERMISSIONS.CONTENT_READ)).toBe(false);
    expect(roleCan(ROLES.ADMIN, PERMISSIONS.CONTENT_READ)).toBe(true);
  });
});
