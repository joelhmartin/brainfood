import { notFound } from "next/navigation";
import { EventsPage } from "../../../../../src/screens/marketing/Events.jsx";
import { getEvents, getSettings } from "../../../../../src/lib/content.server.js";
import { buildMetadata } from "../../../../../src/lib/metadata.js";
import { CONTENT } from "../../../../../src/config/site.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const events = await getEvents();
  const pages = Math.ceil(events.length / CONTENT.events.perPage);
  // Page 1 lives at /events, not /events/page/1 — see eventPageUrl in config/site.js.
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ page: String(i + 2) }));
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const settings = await getSettings();
  return buildMetadata({
    title: `Events — page ${page}`,
    description:
      "Community events, workshops, and sober socials hosted by Brain Food Recovery Services in Austin, Texas.",
    path: `/events/page/${page}`,
    settings,
  });
}

export default async function Page({ params }) {
  const { page } = await params;
  const pageNum = Number(page);
  if (!Number.isInteger(pageNum) || pageNum < 2) notFound();

  const events = await getEvents();
  const totalPages = Math.ceil(events.length / CONTENT.events.perPage);
  if (pageNum > totalPages) notFound();

  return <EventsPage events={events} page={pageNum} />;
}
