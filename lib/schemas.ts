import { z } from "zod";
import { MAX_GUESTS } from "./config";

export const rsvpSchema = z.object({
  name: z.string().trim().min(2, "Introdu numele complet").max(120),
  attending: z.enum(["yes", "no"]),
  guests: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Introdu numele persoanei").max(120),
        isChild: z.boolean(),
      })
    )
    .max(MAX_GUESTS),
  message: z.string().trim().max(500, "Păstrează mesajul sub 500 de caractere").optional(),
  website: z.string().max(200).optional(), // honeypot: real people never fill this in
  // Time trap: how long the visitor spent on the form. Bots that post in the
  // first couple of seconds are dropped the same way as the honeypot.
  elapsedMs: z.number().int().nonnegative().max(86_400_000).optional(),
  // GDPR: the guest agreed to the privacy policy. Required by the server action
  // (not by this schema, so old tests stay valid), and stored as proof.
  consent: z.boolean().optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
