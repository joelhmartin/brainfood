import { useAuthStore } from "../stores/auth.store.js";

/**
 * Fields are selected one at a time on purpose. Zustand v5 compares selector
 * results by reference, so returning a fresh `{...}` object from a single selector
 * would produce a new reference every render and loop forever. Actions are stable
 * references on the store, so selecting them individually is free.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);
  const setPassword = useAuthStore((s) => s.setPassword);
  const updateName = useAuthStore((s) => s.updateName);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    requestPasswordReset,
    setPassword,
    updateName,
  };
}
