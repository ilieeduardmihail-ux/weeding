import { connection } from "next/server";
import { invitationPhotoResponse } from "@/lib/invitation-photo";
import { getEventSettings } from "@/lib/public-data";
import { getTenantBySlug, tenantIsAvailable } from "@/lib/tenants";

/** Invitation photo for one tenant. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant || !tenantIsAvailable(tenant)) {
    return new Response("Lipsește poza invitației.", { status: 404 });
  }
  const settings = await getEventSettings(tenant.id);
  return invitationPhotoResponse(request, settings);
}
