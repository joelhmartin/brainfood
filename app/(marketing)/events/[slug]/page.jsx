import { notFound } from "next/navigation";
import { EventDetailPage } from "../../../../src/screens/marketing/EventDetail.jsx";
import { getEvents, getEventBySlug, getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../../src/lib/metadata.js";
import { eventSchema, breadcrumbSchema } from "../../../../src/lib/seo.js";

export const revalidate = 3600;

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const settings = await getSettings();
  return buildMetadata({
    title: event.title,
    description: event.excerpt,
    path: `/events/${slug}`,
    image: event.image || undefined,
    type: "article",
    settings,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const settings = await getSettings();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: event.title, path: `/events/${slug}` },
  ];

  return (
    <>
      {settings.seoIndexable && (
        <>
          <JsonLd data={eventSchema(event, settings)} />
          <JsonLd data={breadcrumbSchema(crumbs, settings)} />
        </>
      )}
      <EventDetailPage event={event} />
    </>
  );
}
