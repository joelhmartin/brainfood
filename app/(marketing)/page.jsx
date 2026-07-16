import { HomePage } from "../../src/pages/marketing/Home.jsx";
import { getSettings } from "../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../src/lib/metadata.js";
import { organizationSchema } from "../../src/lib/seo.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    description:
      "Recovery coaching, mental health coaching, and sober companion services in Austin, Texas. Practical support, real connection, lasting change.",
    path: "/",
    settings,
  });
}

export default async function Page() {
  const settings = await getSettings();
  const blocked = !settings.seoIndexable;
  return (
    <>
      {!blocked && <JsonLd data={organizationSchema(settings)} />}
      <HomePage />
    </>
  );
}
