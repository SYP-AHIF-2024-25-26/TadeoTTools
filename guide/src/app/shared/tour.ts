import { Stop, StopGroup } from '@shared/models/types';

/** The group's stops in the order the admins set for this group. */
export function stopsInGroupOrder(group: StopGroup, stops: Stop[]): Stop[] {
  const position = (stop: Stop) =>
    stop.orders[stop.stopGroupIds.indexOf(group.id)];
  return stops
    .filter((stop) => stop.stopGroupIds.includes(group.id))
    .sort((a, b) => position(a) - position(b));
}

/** The count next to a group's band: "16 Stationen", "5 von 16 gesehen", "Alle 16 gesehen". */
export function groupCountLine(seen: number, total: number): string {
  if (seen === 0) {
    return total === 1 ? '1 Station' : `${total} Stationen`;
  }
  if (seen >= total) {
    return total === 1 ? 'Gesehen' : `Alle ${total} gesehen`;
  }
  return `${seen} von ${total} gesehen`;
}
