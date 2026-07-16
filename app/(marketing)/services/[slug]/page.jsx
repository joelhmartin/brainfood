import { notFound } from "next/navigation";
import { ServiceDetailPage } from "../../../../src/screens/marketing/ServiceDetail.jsx";
import { SERVICES_CONTENT, getService } from "../../../../src/config/services.js";
import { getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata, JsonLd } from "../../../../src/lib/metadata.js";
import { breadcrumbSchema } from "../../../../src/lib/seo.js";

export function generateStaticParams() {
  return SERVICES_CONTENT.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  const settings = await getSettings();
  // navLabel, not title: `title` is only half a sentence ("One-on-one coaching for")
  // that reads as a fragment in a search result. `tagline` is the one-line summary.
  return buildMetadata({
    title: service.navLabel,
    description: service.tagline,
    path: `/services/${slug}`,
    settings,
  });
}

export default async function Page({ params }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const settings = await getSettings();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: service.navLabel, path: `/services/${slug}` },
  ];

  return (
    <>
      {settings.seoIndexable && <JsonLd data={breadcrumbSchema(crumbs, settings)} />}
      <ServiceDetailPage slug={slug} />
    </>
  );
}
