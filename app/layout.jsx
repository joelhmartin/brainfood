import "./globals.css";
import { Providers } from "./providers.jsx";
import { getSettings } from "../src/lib/content.server.js";
import { buildMetadata } from "../src/lib/metadata.js";
import { TrustindexBadge } from "../src/components/TrustindexBadge.jsx";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({ path: "/", settings });
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <TrustindexBadge />
      </body>
    </html>
  );
}
