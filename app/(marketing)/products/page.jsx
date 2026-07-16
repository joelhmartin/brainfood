import { ProductPage } from "../../../src/pages/marketing/Product.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Products",
    description:
      "Tools and products from Brain Food Recovery Services supporting individuals and families in recovery.",
    path: "/products",
    settings,
  });
}

export default function Page() {
  return <ProductPage />;
}
