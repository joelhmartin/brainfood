/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLES & PERMISSIONS — single source of truth.
 *
 * Only one role ships today: `admin`, which holds every permission. The enum
 * exists so adding a role later is a local change here, not a schema migration:
 *
 *   1. Add the role to ROLES.
 *   2. Give it a permission list in PERMISSIONS.
 *   3. Allow it in the is_admin() SQL function if it should reach the dashboard.
 *
 * `profiles.role` is a plain text column, validated here rather than by a
 * Postgres enum type, precisely so step 1 needs no migration.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const ROLES = {
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Admin",
};

/** Every permission the app checks. Keep these strings in sync with usePermission callers. */
export const PERMISSIONS = {
  CONTENT_READ: "content:read",
  CONTENT_WRITE: "content:write",
  CONTENT_PUBLISH: "content:publish",
  CONTENT_DELETE: "content:delete",
  USERS_READ: "users:read",
  USERS_INVITE: "users:invite",
  USERS_REMOVE: "users:remove",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Takes a ROLE, not a permissions array. The previous implementation passed an
 * array in here, which silently made every permission check return false.
 */
export function roleCan(role, permission) {
  return permissionsForRole(role).includes(permission);
}
