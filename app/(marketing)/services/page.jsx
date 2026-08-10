import { ServicesPage } from "../../../src/screens/marketing/Services.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../src/lib/metadata.js";
import { breadcrumbSchema } from "../../../src/lib/seo.js";

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

export default async function Page() {
  const settings = await getSettings();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
  ];

  return (
    <>
      {settings.seoIndexable && <JsonLd data={breadcrumbSchema(crumbs, settings)} />}
      <ServicesPage />
    </>
  );
}
