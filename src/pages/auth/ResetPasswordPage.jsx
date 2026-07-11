import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { SetPasswordForm } from "../../components/auth/SetPasswordForm.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { useRecoverySession } from "../../hooks/useRecoverySession.js";

export function ResetPasswordPage() {
  const status = useRecoverySession();

  return (
    <AuthLayout>
      <Card>
        <h2 className="mb-6 text-center text-xl font-semibold">Set new password</h2>
        {status === "checking" ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <SetPasswordForm session={status === "ready"} submitLabel="Reset password" />
        )}
      </Card>
    </AuthLayout>
  );
}
