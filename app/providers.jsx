"use client";

import { BreakpointProvider } from "../src/hooks/useBreakpoint.jsx";
import { ToastProvider } from "../src/components/ui/Toast.jsx";

export function Providers({ children }) {
  return (
    <BreakpointProvider>
      <ToastProvider>{children}</ToastProvider>
    </BreakpointProvider>
  );
}
