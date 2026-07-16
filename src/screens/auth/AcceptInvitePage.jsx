import { AuthLayout } from "../../components/layout/AuthLayout.jsx";
import { SetPasswordForm } from "../../components/auth/SetPasswordForm.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { Spinner } from "../../components/ui/Spinner.jsx";
import { useRecoverySession } from "../../hooks/useRecoverySession.js";
import { useSettingsStore } from "../../stores/settings.store.js";

/**
 * Where an invited admin lands from their email.
 *
 * There is no "accept" button to press: the invite already created their account
 * (auth.admin.inviteUserByEmail) and the emailed link signs them in. The only thing
 * left is choosing a password.
 */
export function AcceptInvitePage() {
  const status = useRecoverySession();
  const siteName = useSettingsStore((s) => s.settings.name);

  return (
    <AuthLayout>
      <Card>
        <h2 className="text-center text-xl font-semibold">Welcome to {siteName}</h2>
        <p className="mt-2 mb-6 text-center text-sm text-gray-500">
          Choose a password to finish setting up your account.
        </p>
        {status === "checking" ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <SetPasswordForm session={status === "ready"} submitLabel="Create account" />
        )}
      </Card>
    </AuthLayout>
  );
}
