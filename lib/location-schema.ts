import { z } from "zod";

const emptyToNull = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? null : value;

export const locationSchema = z.object({
  key: z.enum(["church", "venue"]),
  label: z.string().trim().min(2, "Adaugă o etichetă (ex. Biserică)").max(60),
  name: z.string().trim().min(2, "Adaugă numele locației").max(160),
  address: z.string().trim().min(5, "Adaugă adresa completă").max(300),
  event_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Folosește ora în format HH:MM"),
  embed_url: z.preprocess(
    emptyToNull,
    z
      .string()
      .url("Linkul nu este valid")
      .refine(
        (value) => value.startsWith("https://www.google.com/maps"),
        "Linkul trebuie să înceapă cu https://www.google.com/maps"
      )
      .nullable()
  ),
});

export type LocationInput = z.infer<typeof locationSchema>;
