import { AuthLayout } from "../../src/components/layout/AuthLayout.jsx";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }) {
  return <AuthLayout>{children}</AuthLayout>;
}
