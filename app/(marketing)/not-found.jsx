import { NotFoundPage } from "../../src/pages/marketing/NotFound.jsx";
import { getSettings } from "../../src/lib/content.server.js";
import { buildMetadata } from "../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ title: "Page not found", path: "/404", noindex: true, settings });
}

export default function NotFound() {
  return <NotFoundPage />;
}
