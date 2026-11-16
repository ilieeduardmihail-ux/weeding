import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadMailLog } from "@/lib/platform-data";
import { MailPanel } from "./panel";

export const instant = false;

export const metadata: Metadata = {
  title: "Emailuri",
  robots: { index: false, follow: false },
};

export default async function MailLogPage() {
  // Owner-only and live: never a build-time snapshot.
  await connection();
  if (!(await isOwnerRequest())) redirect("/platform/login");

  const configured = platformIsConfigured();
  const mails = configured ? await loadMailLog() : [];

  return <MailPanel mails={mails} configured={configured} />;
}
