import { revalidatePath } from "next/cache";
import { requirePermission, errorResponse } from "../../../src/lib/api/auth.js";
import { PERMISSIONS } from "../../../src/config/roles.js";

/**
 * Refreshes the static HTML for a published item. Replaces the old deploy-hook
 * rebuild: instead of rebuilding the whole site (~minutes, and it fired a cloud
 * build that could not even run the prerender), this regenerates one page in
 * seconds.
 */
export async function POST(request) {
  try {
    await requirePermission(request, PERMISSIONS.CONTENT_PUBLISH);

    const { type, slug } = await request.json();

    if (type === "post") {
      revalidatePath("/blog");
      if (slug) revalidatePath(`/blog/${slug}`);
    } else if (type === "event") {
      revalidatePath("/events");
      if (slug) revalidatePath(`/events/${slug}`);
    } else if (type === "settings") {
      revalidatePath("/", "layout");
    } else {
      return Response.json({ error: "Unknown type." }, { status: 400 });
    }

    revalidatePath("/sitemap.xml");
    return Response.json({ ok: true, revalidated: true });
  } catch (err) {
    return errorResponse(err);
  }
}
