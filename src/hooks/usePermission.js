import { useAuthStore } from "../stores/auth.store.js";
import { roleCan, permissionsForRole } from "../config/roles.js";

/**
 * Permission checks for the signed-in admin.
 *
 * The previous version passed a permissions ARRAY into a function expecting a ROLE
 * string, so `can()` silently returned false for everything — which is why the
 * Members link, the Settings link, and the Invite button never appeared.
 *
 * These checks drive the UI only. Enforcement is in Postgres (see the RLS policies):
 * hiding a button does not stop anyone from calling the API directly.
 */
export function usePermission() {
  const role = useAuthStore((s) => s.user?.role);

  return {
    can: (permission) => roleCan(role, permission),
    permissions: permissionsForRole(role),
    role,
  };
}
