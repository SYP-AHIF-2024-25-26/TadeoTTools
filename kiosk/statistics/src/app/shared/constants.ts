/** localStorage key of the statistics last loaded from the backend, with their time. */
export const STATISTICS_CACHE_KEY = 'tadeot-statistics-data';

/** The counts change during the day; one refresh a minute is plenty for a wall. */
export const REFRESH_MS = 60000;

/** Retry interval while there is no data at all (first start without network). */
export const RETRY_MS = 15000;

/** How long one request may take before it counts as failed. */
export const REQUEST_TIMEOUT_MS = 10000;

/** Seconds per slide: `?delay=N`, limited to this range. */
export const DEFAULT_DELAY_S = 10;
export const MIN_DELAY_S = 3;
export const MAX_DELAY_S = 120;

/**
 * The hours slide shows the latest day plus the days with registrations in
 * the week before it (a two-day open day), at most this many rows. Older
 * days (last year, test registrations) stay off the wall.
 */
export const TIME_WINDOW_DAYS = 7;
export const MAX_TIME_DAYS = 3;

/** A bar chart shows at most this many bars; the rest are summed up as "n weitere". */
export const MAX_BARS = 12;

/**
 * The division colours as documented in DESIGN.md. This kiosk only reads the
 * legacy backend, which has no colours; keep them in sync with the dashboard.
 */
export const DIVISION_COLORS: Record<string, string> = {
  Informatik: '#0059A7',
  Medientechnik: '#70B4D9',
  Elektronik: '#CE1223',
  Medizintechnik: '#f1a102',
};

/** Legacy category names that read better in full on the wall. */
export const DEPARTMENT_LABELS: Record<string, string> = {
  Fachschule: 'Fachschule Elektronik',
};
