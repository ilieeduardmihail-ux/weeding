import { connection } from "next/server";
import { invitationPhotoResponse } from "@/lib/invitation-photo";
import { getDefaultEventSettings } from "@/lib/public-data";

/** Invitation photo for the wedding served at the root of the domain. */
export async function GET(request: Request) {
  // Read the link per request, so replacing the photo is visible immediately.
  await connection();
  const settings = await getDefaultEventSettings();
  return invitationPhotoResponse(request, settings);
}
