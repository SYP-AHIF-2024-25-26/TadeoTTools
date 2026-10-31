import { MapPlace } from '@shared/models/types';

/** The room on the floor plans that a stop's room text points to, e.g. "101 (Aula)" → "101". */
export function mapRoomOf(roomNr: string | undefined): string | null {
  if (!roomNr) {
    return null;
  }
  return (
    roomNr.match('\\b\\d{1,3}\\b|[UEK]\\d{2}(-\\d)?|EG|UG|OG')?.[0] ?? null
  );
}

/** The floor plans, bottom to top. Width and height keep the plan's shape before the image loads. */
export const FLOORS = [
  {
    code: 'U',
    name: 'Untergeschoss',
    image: 'assets/plans/plan-U.png',
    width: 1917,
    height: 2238,
  },
  {
    code: 'E',
    name: 'Erdgeschoss',
    image: 'assets/plans/plan-E.png',
    width: 1824,
    height: 2106,
  },
  {
    code: '1',
    name: '1. Stock',
    image: 'assets/plans/plan-1.png',
    width: 2154,
    height: 2229,
  },
] as const;

/** The entrance floor: where the map opens without a room, or with one it cannot place. */
export const ENTRANCE_FLOOR = 1;

/** The floor plan a map room is on: "U34" → Untergeschoss, "E24" → Erdgeschoss, "101" → 1. Stock. */
export function floorOf(mapRoom: string | undefined): number {
  switch (mapRoom?.charAt(0).toUpperCase()) {
    case 'U':
    case 'K':
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

/** "Raum 101 · Aula OG", or the spot itself: "Gang bis 143". */
export function placeTitle(place: MapPlace): string {
  const title = /\s/.test(place.code) ? place.code : `Raum ${place.code}`;
  return place.name ? `${title} · ${place.name}` : title;
}
