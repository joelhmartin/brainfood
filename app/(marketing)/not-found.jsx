import { NotFoundPage } from "../../src/pages/marketing/NotFound.jsx";
import { getSettings } from "../../src/lib/content.server.js";
import { notFoundMetadata } from "../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return notFoundMetadata(settings);
}

export default function NotFound() {
  return <NotFoundPage />;
}
