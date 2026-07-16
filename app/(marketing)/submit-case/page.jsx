import { CaseSubmissionPage } from "../../../src/screens/marketing/CaseSubmission.jsx";
import { getSettings } from "../../../src/lib/content.server.js";
import { buildMetadata } from "../../../src/lib/metadata.js";

export async function generateMetadata() {
  const settings = await getSettings();
  return buildMetadata({
    title: "Submit a Case",
    description:
      "Refer a client or submit a case to Brain Food Recovery Services. Confidential, and we respond quickly.",
    path: "/submit-case",
    settings,
  });
}

export default function Page() {
  return <CaseSubmissionPage />;
}
