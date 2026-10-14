/** The room on the floor plans that a stop's room text points to, e.g. "101 (Aula)" → "101". */
export function mapRoomOf(roomNr: string | undefined): string | null {
  if (!roomNr) {
    return null;
  }
  return roomNr.match('\\b\\d{1,3}\\b|U\\d{2}|E\\d{2}|EG|UG|OG')?.[0] ?? null;
}

/** The floor plans, bottom to top. */
export const FLOORS = [
  { name: 'Untergeschoss', image: 'assets/stockwerk-U.png' },
  { name: 'Erdgeschoss', image: 'assets/stockwerk-E.png' },
  { name: '1. Stock', image: 'assets/stockwerk-1.png' },
] as const;

/** The entrance floor: where the map opens without a room, or with one it cannot place. */
export const ENTRANCE_FLOOR = 1;

/** The floor plan a map room is on: "U34" → Untergeschoss, "E24" → Erdgeschoss, "101" → 1. Stock. */
export function floorOf(mapRoom: string | undefined): number {
  switch (mapRoom?.charAt(0).toUpperCase()) {
    case 'U':
      return 0;
    case 'E':
      return 1;
    case '1':
    case 'O':
      return 2;
    default:
      return ENTRANCE_FLOOR;
  }
}

/** "EG", "UG", "OG" name a whole floor, not a room. */
export function isFloorCode(mapRoom: string | undefined): boolean {
  return /^(UG|EG|OG)$/i.test(mapRoom ?? '');
}
