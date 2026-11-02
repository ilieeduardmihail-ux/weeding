import { z } from "zod";
import { MAX_GUESTS } from "./config";

/** A guest id is sent back for people who already existed, so seats are kept. */
const guestId = z.union([z.literal(""), z.string().uuid()]).nullable();

export const adminRsvpSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "Introdu numele complet").max(120),
  attending: z.enum(["yes", "no"]),
  message: z.string().trim().max(500, "Păstrează mesajul sub 500 de caractere").optional(),
  guests: z
    .array(
      z.object({
        guestId,
        name: z.string().trim().min(1, "Introdu numele persoanei").max(120),
        isChild: z.boolean(),
      })
    )
    .max(MAX_GUESTS),
});

export type AdminRsvpInput = z.infer<typeof adminRsvpSchema>;
