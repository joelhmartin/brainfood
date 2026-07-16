import { ServicesPage } from "../../../src/screens/marketing/Services.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Services",
    description:
      "Recovery coaching, mental health coaching, family coaching, and sober companion services for individuals and families in Austin, Texas.",
    path: "/services",
    settings,
  });
}

export default function Page() {
  return <ServicesPage />;
}
