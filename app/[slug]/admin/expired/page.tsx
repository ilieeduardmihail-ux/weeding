import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CalendarX2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTenantContextForSlug } from "@/lib/tenant-session";
import { tenantIsAvailable } from "@/lib/tenants";
import { signOut } from "@/app/admin/actions";

// Per-user, and it reads the session to pick the message.
export const instant = false;

export const metadata: Metadata = {
  title: "Acces indisponibil",
  robots: { index: false, follow: false },
};

const CONTACT = "contact@wedding-ro.vercel.app";

export default async function ExpiredPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const { email, tenant } = await getTenantContextForSlug(slug);
  if (!email) redirect(`/${slug}/admin/login`);
  if (!tenant) redirect("/admin");
  if (tenantIsAvailable(tenant)) redirect(`/${slug}/admin`);

  const suspended = tenant.status === "suspended";

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold">
        <CalendarX2 className="size-6" aria-hidden="true" />
      </span>

      <div>
        <h1 className="font-display text-4xl">
          {suspended ? "Site-ul este suspendat" : "Perioada de acces a expirat"}
        </h1>
        <p className="mt-4 text-ink/75">
          {suspended
            ? `Accesul la panoul nunții „${tenant.display_name}” a fost suspendat. Pagina publică nu mai este vizibilă pentru invitați.`
            : `Perioada de acces pentru nunta „${tenant.display_name}” s-a încheiat. Pagina publică și panoul de administrare sunt momentan indisponibile, dar toate datele voastre sunt în siguranță.`}
        </p>
        <p className="mt-3 text-ink/75">
          Scrie-ne pentru a prelungi accesul și totul revine exact așa cum a fost.
        </p>
      </div>

      <a
        href={`mailto:${CONTACT}`}
        className="glass flex items-center gap-3 rounded-xl p-4 text-sm"
      >
        <Mail className="size-4 text-gold" aria-hidden="true" />
        <span className="font-medium">{CONTACT}</span>
      </a>

      <form action={signOut}>
        <Button type="submit" variant="outline" className="w-full">
          Ieși din cont
        </Button>
      </form>
    </main>
  );
}
