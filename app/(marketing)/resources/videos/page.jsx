import { ComingSoonPage } from "../../../../src/pages/marketing/ComingSoon.jsx";
import { getSettings } from "../../../../src/lib/content.server.js";
import { buildMetadata } from "../../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Instructional Videos", path: "/resources/videos", settings });
}

export default function Page() {
  return <ComingSoonPage />;
}
