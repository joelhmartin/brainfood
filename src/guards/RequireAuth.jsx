"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth.js";
import { Spinner } from "../components/ui/Spinner.jsx";
import { ROUTES } from "../config/routes.js";

/**
 * Builds the login URL that carries the attempted path back via a `?from=`
 * query param. next/navigation has no equivalent of react-router's `state`,
 * so this is the replacement for the old `<Navigate state={{ from }} />`.
 * `pathname` comes from usePathname(), which is always a plain path (no
 * origin, no query string), but it's still encoded defensively since it
 * ends up in a URL. LoginForm's safeRedirectPath() does the actual
 * open-redirect validation on the way back out.
 */
export function buildLoginRedirectUrl(pathname) {
  return `${ROUTES.LOGIN}?from=${encodeURIComponent(pathname)}`;
}

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(buildLoginRedirectUrl(pathname));
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect is in flight (the effect above).
    return null;
  }

  return children;
}
