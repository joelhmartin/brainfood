import { RequireAuth } from "../../src/guards/RequireAuth.jsx";
import { AppShell } from "../../src/components/layout/AppShell.jsx";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
