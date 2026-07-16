"use client";

import { useEffect } from "react";
import { BreakpointProvider } from "../src/hooks/useBreakpoint.jsx";
import { ToastProvider } from "../src/components/ui/Toast.jsx";
import { useAuthStore } from "../src/stores/auth.store.js";

export function Providers({ children }) {
  const init = useAuthStore((s) => s.init);

  // Resolves the current Supabase session once, at the client app root. This
  // used to run in the old react-router AppRoutes() (src/App.jsx), which is
  // being decommissioned rather than ported route-by-route — nothing else in
  // the App Router tree calls it. Without this, useAuthStore().isLoading never
  // leaves its initial `true`, so RequireAuth (src/guards/RequireAuth.jsx)
  // would show its loading spinner forever and never redirect or admit anyone.
  useEffect(() => {
    init();
  }, [init]);

  return (
    <BreakpointProvider>
      <ToastProvider>{children}</ToastProvider>
    </BreakpointProvider>
  );
}
