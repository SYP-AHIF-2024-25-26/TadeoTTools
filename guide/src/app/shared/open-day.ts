/** The open day always ends at 19:00; only its start is set in the dashboard (countdown setting). */
const CLOSING_HOUR = 19;

/** Keeps "Uhr" on the line of its time. */
const NO_BREAK_SPACE = ' ';

/**
 * "Freitag, 20. November 2026, 13–19 Uhr", from the start date and time
 * of the countdown setting. Without a start time only the date.
 */
export function openDayLine(start: Date): string {
  const day = start.toLocaleDateString('de-AT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (start.getHours() === 0 && start.getMinutes() === 0) {
    return day;
  }
  const from =
    start.getMinutes() === 0
      ? `${start.getHours()}`
      : `${start.getHours()}:${start.getMinutes().toString().padStart(2, '0')}`;
  return `${day}, ${from}–${CLOSING_HOUR}${NO_BREAK_SPACE}Uhr`;
}

/** The setting's date, if it is today or later; an old date from last year shows nothing. */
export function upcomingOpenDay(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today ? date : null;
}
