/** The room on the floor plans that a stop's room text points to, e.g. "101 (Aula)" → "101". */
export function mapRoomOf(roomNr: string | undefined): string | null {
  if (!roomNr) {
    return null;
  }
  return roomNr.match('\\b\\d{1,3}\\b|U\\d{2}|E\\d{2}|EG|UG')?.[0] ?? null;
}
