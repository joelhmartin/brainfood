"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema } from "../../config/schemas.js";
import { Input } from "../ui/Input.jsx";
import { Button } from "../ui/Button.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../ui/Toast.jsx";
import { ROUTES } from "../../config/routes.js";

/**
 * Validates that `from` (an attacker-controllable query param) is a safe,
 * same-origin relative path before it's handed to router.replace(). Rejects
 * anything that could make the browser navigate off-site: absolute URLs
 * (https://evil.com), protocol-relative URLs (//evil.com — note
 * "//evil.com".startsWith("/") is true, so a bare startsWith check is not
 * enough), backslash variants (/\evil.com, which some browsers normalize to
 * //evil.com), and non-path schemes (javascript:). Falls back to
 * ROUTES.DASHBOARD for anything missing or rejected.
 */
export function safeRedirectPath(from) {
  if (typeof from !== "string" || from.length === 0) return ROUTES.DASHBOARD;
  // Must start with a single "/" and not be followed by another "/" or "\",
  // which browsers treat as a scheme-relative host (//evil.com, /\evil.com).
  if (!/^\/(?!\/|\\)/.test(from)) return ROUTES.DASHBOARD;
  return from;
}

export function LoginForm() {
  const { login } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    try {
      await login(data);
      // Send them back to whatever they were trying to reach before the
      // redirect, via a `from` query param (RequireAuth still needs updating
      // to set it — Task 12 — until then this is always absent).
      const from = new URLSearchParams(window.location.search).get("from");
      router.replace(safeRedirectPath(from));
    } catch (err) {
      addToast({ message: err.message || "Login failed", type: "error" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
