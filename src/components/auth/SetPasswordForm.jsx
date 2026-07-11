import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { setPasswordSchema } from "../../config/schemas.js";
import { Input } from "../ui/Input.jsx";
import { Button } from "../ui/Button.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTES } from "../../config/routes.js";

/**
 * Sets a password for the CURRENT session.
 *
 * Both the reset-password link and the invite link land the user in a real Supabase
 * session before they ever reach this form (supabase-js reads the token out of the
 * URL fragment on load — `detectSessionInUrl`). So there is no token to pass around
 * and no token to validate here: if the link were bad or expired, there would be no
 * session, and `session` below would be false.
 */
export function SetPasswordForm({ session, submitLabel = "Set password" }) {
  const { setPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(setPasswordSchema) });

  const onSubmit = async ({ password }) => {
    try {
      await setPassword(password);
      addToast({ message: "Password set. Welcome in.", type: "success" });
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      addToast({ message: err.message || "Could not set password.", type: "error" });
    }
  };

  if (!session) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-gray-600">
          This link is invalid or has expired. Links are single-use and time-limited.
        </p>
        <Button variant="secondary" onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
