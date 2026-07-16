import Link from "next/link";
import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { LoginForm } from "../../components/auth/LoginForm.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { ROUTES } from "../../config/routes.js";

/**
 * No "Sign up" link, by design. Every account is an admin account, so sign-up is
 * disabled server-side and new admins arrive only by invitation from the dashboard.
 */
export function LoginPage() {
  return (
    <AuthLayout>
      <Card>
        <h2 className="mb-6 text-center text-xl font-semibold">Sign in to your account</h2>
        <LoginForm />
        <p className="mt-4 text-center text-sm">
          <Link href={ROUTES.FORGOT_PASSWORD} className="text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
