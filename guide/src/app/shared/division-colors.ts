import { Division, Stop } from '@shared/models/types';

/** Fill for stops without a division: neutral, so it never reads as a fifth division. */
export const NO_DIVISION_COLOR = '#d1d5db';

/**
 * Fixed left-to-right order of a gradient through several divisions (user decision
 * 2026-10-12: HIF blue first, HITM light blue last), independent of the order of a
 * stop's divisionIds. Divisions not listed follow in their own order.
 */
const GRADIENT_ORDER = ['HIF', 'HITM', 'HEL', 'HBG'];

/** The stop's division colours in the fixed gradient order; never tinted. */
export function colorsOfStop(stop: Stop, divisions: Division[]): string[] {
  const rank = (division: Division) => {
    const index = GRADIENT_ORDER.indexOf(division.name.toUpperCase());
    return index === -1 ? GRADIENT_ORDER.length : index;
  };
  return stop.divisionIds
    .map((id) => divisions.find((division) => division.id === id))
    .filter((division): division is Division => !!division?.color)
    .sort((a, b) => rank(a) - rank(b))
    .map((division) => division.color);
}

/** One colour as is; several as a left-to-right gradient through the exact colours. */
export function divisionFill(colors: string[]): string {
  if (colors.length === 0) {
    return NO_DIVISION_COLOR;
  }
  if (colors.length === 1) {
    return colors[0];
  }
  return `linear-gradient(to right, ${colors.join(', ')})`;
}

/**
 * Answer texts name divisions in full ("Informatik"), the backend by their short code.
 * Both are matched; extend this when the school adds a division.
 */
const DIVISION_CODES: Record<string, string> = {
  informatik: 'HIF',
  medientechnik: 'HITM',
  elektronik: 'HEL',
  medizintechnik: 'HBG',
};

/** The exact colour of the division a text names ("Informatik", "HIF"), or null. */
export function divisionColorFor(
  text: string,
  divisions: Division[]
): string | null {
  const key = text.trim().toLowerCase();
  const code = (DIVISION_CODES[key] ?? key).toLowerCase();
  const division = divisions.find((d) => d.name.trim().toLowerCase() === code);
  return division?.color || null;
}
