import { EventsPage } from "../../../src/screens/marketing/Events.jsx";
import { getEvents, getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../src/lib/metadata.js";
import { breadcrumbSchema } from "../../../src/lib/seo.js";
import { CONTENT } from "../../../src/config/site.js";

export const revalidate = 3600;

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Events",
    description:
      "Community events, workshops, and sober socials hosted by Brain Food Recovery Services in Austin, Texas.",
    path: "/events",
    settings,
  });
}

export default async function Page() {
  const [events, settings] = await Promise.all([getEvents(), getSettings()]);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: CONTENT.events.label, path: CONTENT.events.listPath },
  ];

  return (
    <>
      {settings.seoIndexable && <JsonLd data={breadcrumbSchema(crumbs, settings)} />}
      <EventsPage events={events} page={1} />
    </>
  );
}
