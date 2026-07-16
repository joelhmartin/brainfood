import { AboutPage } from "../../../src/screens/marketing/About.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "About",
    description:
      "Meet the Brain Food Recovery Services team. Coaching grounded in lived experience — practical, honest, and built on real connection.",
    path: "/about",
    settings,
  });
}

export default function Page() {
  return <AboutPage />;
}
