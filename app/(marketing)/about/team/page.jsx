import { ComingSoonPage } from "../../../../src/pages/marketing/ComingSoon.jsx";
import { getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata } from "../../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Team", path: "/about/team", settings });
}

export default function Page() {
  return <ComingSoonPage />;
}
