"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Armchair } from "lucide-react";
import { adminRsvpSchema, type AdminRsvpInput } from "@/lib/admin-rsvp-schema";
import { MAX_GUESTS } from "@/lib/config";
import { updateRsvp } from "@/app/admin/rsvps/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RsvpForEdit = {
  id: string;
  name: string;
  attending: boolean;
  message: string | null;
  guests: { id: string; name: string; is_child: boolean; table_number: number | null }[];
};

export function RsvpEditor({ rsvp }: { rsvp: RsvpForEdit }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const seats = useMemo(
    () => new Map(rsvp.guests.map((g) => [g.id, g.table_number] as const)),
    [rsvp.guests]
  );

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdminRsvpInput>({
    resolver: zodResolver(adminRsvpSchema),
    defaultValues: {
      id: rsvp.id,
      name: rsvp.name,
      attending: rsvp.attending ? "yes" : "no",
      message: rsvp.message ?? "",
      guests: rsvp.guests.map((g) => ({ guestId: g.id, name: g.name, isChild: g.is_child })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "guests" });
  const attending = watch("attending");

  const onSubmit = (data: AdminRsvpInput) => {
    setServerError(null);
    start(async () => {
      const res = await updateRsvp(data);
      if (res.ok) {
        router.push("/admin?edited=1");
        router.refresh();
      } else {
        setServerError(res.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
      <input type="hidden" {...register("id")} />

      <div className="space-y-2">
        <Label htmlFor="admin-name">Numele complet</Label>
        <Input id="admin-name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        {errors.name && <p className="text-sm text-red-300">{errors.name.message}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Poate ajunge?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={attending === value}
              onClick={() => setValue("attending", value, { shouldValidate: true })}
              className={`rounded-md border px-4 py-3 transition focus-visible:outline-2 focus-visible:outline-gold ${
                attending === value ? "border-ink bg-ink text-sea" : "border-ink/30 hover:border-ink"
              }`}
            >
              {value === "yes" ? "Da, vine" : "Nu vine"}
            </button>
          ))}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {attending === "yes" && (
          <motion.div
            key="party"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pb-1">
              <div>
                <p className="text-sm font-medium">Însoțitorii</p>
                <p className="text-xs text-ink/60">
                  Mesele deja alocate rămân neschimbate pentru persoanele existente.
                </p>
              </div>

              {fields.map((field, index) => {
                const seat = field.guestId ? seats.get(field.guestId) : null;
                return (
                  <div key={field.id} className="flex items-start gap-3 rounded-lg border border-ink/10 p-3">
                    <input type="hidden" {...register(`guests.${index}.guestId`)} />
                    <div className="flex-1 space-y-1">
                      <Input
                        aria-label={`Numele persoanei ${index + 1}`}
                        placeholder="Nume complet"
                        {...register(`guests.${index}.name`)}
                      />
                      {errors.guests?.[index]?.name && (
                        <p className="text-sm text-red-300">{errors.guests[index]!.name!.message}</p>
                      )}
                      <label className="flex items-center gap-2 text-sm text-ink/75">
                        <input type="checkbox" {...register(`guests.${index}.isChild`)} /> Copil
                      </label>
                      {seat !== null && seat !== undefined && (
                        <p className="flex items-center gap-1.5 text-xs text-ink/60">
                          <Armchair className="size-3.5" aria-hidden="true" /> Păstrează masa {seat}
                        </p>
                      )}
                    </div>
                    <Button type="button" variant="ghost" onClick={() => remove(index)}>
                      Elimină
                    </Button>
                  </div>
                );
              })}

              {fields.length < MAX_GUESTS && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ guestId: null, name: "", isChild: false })}
                >
                  Adaugă o persoană
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="admin-message">Mesaj (opțional)</Label>
        <textarea
          id="admin-message"
          rows={3}
          {...register("message")}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 focus-visible:outline-2 focus-visible:outline-gold"
        />
        {errors.message && <p className="text-sm text-red-300">{errors.message.message}</p>}
      </div>

      {serverError && <p role="alert" className="text-red-300">{serverError}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending} className="bg-ink text-sea hover:bg-ink/85">
          {pending ? "Se salvează…" : "Salvează modificările"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Renunță</Link>
        </Button>
      </div>
    </form>
  );
}
