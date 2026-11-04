"use client";
import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { rsvpSchema, type RsvpInput } from "@/lib/schemas";
import { MAX_GUESTS } from "@/lib/config";
import { submitRsvp } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RsvpForm({ initialName = "", onDone }: { initialName?: string; onDone: (name: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RsvpInput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { name: initialName, attending: "yes", guests: [], message: "", website: "" },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "guests" });
  const attending = watch("attending");

  const onSubmit = (data: RsvpInput) => {
    setServerError(null);
    start(async () => {
      const res = await submitRsvp(data);
      if (res.ok) onDone(data.name.trim());
      else setServerError(res.error);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass mt-8 space-y-6 rounded-xl p-5" noValidate>
      {/* Honeypot: off-screen, skipped by keyboards and screen readers, still visible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} /></label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Numele complet</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby="name-hint" {...register("name")} />
        <p id="name-hint" className="text-sm text-ink/60">Folosește numele de pe invitație. Îl vei folosi și ca să-ți verifici masa.</p>
        {errors.name && <p className="text-sm text-red-300">{errors.name.message}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Poți ajunge?</legend>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={attending === v}
              onClick={() => setValue("attending", v)}
              className={`rounded-md border px-4 py-3 transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
                attending === v ? "border-ink bg-ink text-sea shadow-lg shadow-black/20" : "border-ink/30 hover:border-ink hover:bg-ink/5"
              }`}
            >
              {v === "yes" ? "Da, vin cu drag" : "Din păcate, nu pot"}
            </button>
          ))}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {attending === "yes" && (
          <motion.div key="party" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-4 pb-1">
              <p className="text-sm font-medium">Alte persoane din grupul tău</p>
              {fields.map((f, i) => (
                <div key={f.id} className="flex items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <Input aria-label={`Numele persoanei ${i + 1}`} placeholder="Nume complet" {...register(`guests.${i}.name`)} />
                    {errors.guests?.[i]?.name && <p className="text-sm text-red-300">{errors.guests[i]!.name!.message}</p>}
                    <label className="flex items-center gap-2 text-sm text-ink/75">
                      <input type="checkbox" {...register(`guests.${i}.isChild`)} /> Copil
                    </label>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => remove(i)}>Elimină</Button>
                </div>
              ))}
              {fields.length < MAX_GUESTS && (
                <Button type="button" variant="outline" onClick={() => append({ name: "", isChild: false })}>Adaugă o persoană</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        <Label htmlFor="message">Mesaj pentru mir(i) (opțional)</Label>
        <textarea id="message" rows={3} {...register("message")}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 transition-[border-color,box-shadow] duration-200 focus-visible:border-gold focus-visible:outline-2 focus-visible:outline-gold" />
        {errors.message && <p className="text-sm text-red-300">{errors.message.message}</p>}
      </div>

      {serverError && <p role="alert" className="text-red-300">{serverError}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-full bg-ink text-sea hover:bg-ink/85">
        {pending ? "Se trimite…" : "Trimite răspunsul"}
      </Button>
    </form>
  );
}
