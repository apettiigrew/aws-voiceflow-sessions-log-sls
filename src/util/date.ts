import { DateTime } from "luxon";

const JAMAICA_TZ = "America/Jamaica";

export function nowJamaicaMs(): number {
  return DateTime.now().setZone(JAMAICA_TZ).toMillis();
}

export function nowJamaica(): DateTime {
  return DateTime.now().setZone(JAMAICA_TZ);
}
