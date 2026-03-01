import { DateTime } from "luxon";
import z from "zod";

const JAMAICA_TZ = "America/Jamaica";

export function nowJamaicaMs(): number {
  return DateTime.now().setZone(JAMAICA_TZ).toMillis();
}

export function nowJamaica(): DateTime {
  return DateTime.now().setZone(JAMAICA_TZ);
}


export const chatEventBodySchema = z.object({
  userId: z.string().min(1, "userId is required and must be a non-empty string"),
  timestamp: z.string()
});

export type ChatEvent = z.infer<typeof chatEventBodySchema>;