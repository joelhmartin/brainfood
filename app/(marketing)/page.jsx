import { HomePage } from "../../src/screens/marketing/Home.jsx";
import { getSettings } from "../../src/lib/content.server.js";
import { getFacebookFeed } from "../../src/lib/facebook.server.js";
import { buildMetadata, JsonLd } from "../../src/lib/metadata.js";
import { organizationSchema, websiteSchema } from "../../src/lib/seo.js";

/**
 * The homepage now carries third-party content, so it can no longer be baked
 * once at build time. Beyond the feed going stale, Facebook's `full_picture`
 * URLs are signed with an expiry — a permanently cached page would keep serving
 * URLs that Facebook has stopped honouring, and every photo would break.
 */
export const revalidate = 3600;

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
  // Fetched together: the feed degrades to null on its own, so it can never
  // hold up or fail the settings read the rest of the page depends on.
  const [settings, facebook] = await Promise.all([
    getSettings(),
    getFacebookFeed({ revalidate }),
  ]);
  const blocked = !settings.seoIndexable;
  return (
    <>
      {!blocked && (
        <>
          <JsonLd data={organizationSchema(settings)} />
          <JsonLd data={websiteSchema(settings)} />
        </>
      )}
      <HomePage facebook={facebook} />
    </>
  );
}
