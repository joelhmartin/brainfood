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
      // Send them back to whatever they were trying to reach before the redirect.
      //
      // react-router carried this as `location.state.from.pathname`, set by
      // <Navigate state={{ from: location }}> in src/guards/RequireAuth.jsx.
      // next/navigation has no router-state equivalent, so this reads a `from`
      // query param instead. RequireAuth (owned by Task 12, not touched here)
      // still sets react-router-style `state` — until it's updated to redirect
      // with `?from=<pathname>`, this param will simply be absent and login
      // will always land on ROUTES.DASHBOARD. See task-11-report.md for details.
      const from = new URLSearchParams(window.location.search).get("from");
      router.replace(from || ROUTES.DASHBOARD);
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
