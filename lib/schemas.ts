import { z } from "zod";
import { MAX_GUESTS } from "./config";

export const rsvpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  attending: z.enum(["yes", "no"]),
  guests: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Enter this guest's name").max(120),
        isChild: z.boolean(),
      })
    )
    .max(MAX_GUESTS),
  message: z.string().trim().max(500, "Keep it under 500 characters").optional(),
  website: z.string().max(200).optional(), // honeypot: real people never fill this in
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
