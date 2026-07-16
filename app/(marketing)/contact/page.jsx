import { ContactPage } from "../../../src/pages/marketing/Contact.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Contact",
    description:
      "Reach out for a confidential conversation about recovery coaching and support. We work with individuals and families at every stage.",
    path: "/contact",
    settings,
  });
}

export default function Page() {
  return <ContactPage />;
}
