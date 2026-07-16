import { EventsPage } from "../../../src/screens/marketing/Events.jsx";
import { getEvents, getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

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
  const events = await getEvents();
  return <EventsPage events={events} page={1} />;
}
