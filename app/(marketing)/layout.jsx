import { Navbar } from "../../src/components/marketing/Navbar.jsx";
import { Footer } from "../../src/components/marketing/Footer.jsx";

export default function MarketingLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
