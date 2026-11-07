"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { RsvpEditor, type RsvpForEdit } from "@/components/admin/rsvp-editor";

export default function EditRsvpPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data } = useAdminData();
  const row = data?.rsvps.find((item) => item.id === id);

  useEffect(() => {
    if (data && !row) router.replace("/admin?error=missing");
  }, [data, row, router]);

  if (!data || !row) return <AdminSectionSkeleton />;

  const rsvp: RsvpForEdit = {
    id: row.id,
    name: row.name,
    attending: row.attending,
    message: row.message,
    guests: (row.rsvp_guests ?? []).map((guest) => ({
      id: guest.id,
      name: guest.name,
      is_child: guest.is_child,
      table_number: guest.table_number,
    })),
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin" className="text-sm text-ink/60 underline-offset-4 hover:underline">
        ← Lista invitaților
      </Link>
      <h1 className="mt-4 font-display text-4xl">Editează răspunsul</h1>
      <p className="mt-2 text-ink/70">
        Modifică numele, prezența, mesajul și însoțitorii. Mesele deja alocate se păstrează.
      </p>
      <RsvpEditor rsvp={rsvp} />
    </main>
  );
}
