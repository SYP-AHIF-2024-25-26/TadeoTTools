import {
  DEPARTMENT_LABELS,
  DIVISION_COLORS,
  MAX_BARS,
  MAX_TIME_DAYS,
  TIME_WINDOW_DAYS,
} from '@shared/constants';
import { Bar, Slide, Statistics, VisitorResult } from '@shared/types';

/** Bars that are not a division (and the summed-up rest). */
const NEUTRAL = '#9ca3af';
/** The two parts of the gender bar: two neutral tones, no blue and pink. */
const GENDER_COLORS = ['#374151', '#9ca3af'];

/**
 * The slides in their fixed order, built from one data snapshot. A chart
 * without data is left out; with no registrations at all there is no slide.
 */
export function buildSlides(data: Statistics | null): Slide[] {
  if (!data || data.count.count <= 0) return [];
  const slides: (Slide | null)[] = [
    {
      kind: 'total',
      registered: data.count.count,
      withCompany: data.count.count + data.count.adultsCount,
    },
    timeSlide(data.byTime),
    barSlide({
      kind: 'bars',
      id: 'departments',
      title: 'Das interessiert unsere Gäste',
      note: 'Mehrfachnennungen möglich',
      bars: bars(data.departments, (r) => ({
        label: DEPARTMENT_LABELS[r.category] ?? r.category,
        count: r.count,
        color: DIVISION_COLORS[r.category] ?? NEUTRAL,
      })),
    }),
    barSlide({
      kind: 'bars',
      id: 'reasons',
      title: 'So haben unsere Gäste von uns erfahren',
      bars: bars(data.reasons),
    }),
    barSlide({
      kind: 'bars',
      id: 'schoolTypes',
      title: 'Aus diesen Schulen kommen unsere Gäste',
      bars: bars(data.schoolTypes),
      percentOf: sum(data.schoolTypes),
    }),
    // The legacy endpoint counts the towns with registrations per district
    // (top 10), not the visitors, and says so here.
    barSlide({
      kind: 'bars',
      id: 'districts',
      title: 'Aus diesen Bezirken kommen unsere Gäste',
      note: 'Zahl der Gemeinden je Bezirk, aus denen sich jemand angemeldet hat',
      bars: bars(data.districts),
      unit: { one: 'Gemeinde', many: 'Gemeinden' },
    }),
    genderSlide(data.gender),
  ];
  return slides.filter((s): s is Slide => s !== null);
}

/** Identifies a slide across data refreshes. */
export function slideId(slide: Slide): string {
  return slide.kind === 'bars' ? slide.id : slide.kind;
}

/**
 * Registrations per hour of the latest open day: the latest day in the data
 * and the days with registrations in the week before it (at most
 * MAX_TIME_DAYS), one row per day on a shared hour axis. Older days stay out,
 * unless the URL says `?days=all` (for trying the rows with older data).
 * The legacy backend already shifts the hour to local winter time:
 * "21.11.2025-14:00" is 14–15 Uhr.
 */
function timeSlide(results: VisitorResult[]): Slide | null {
  const parsed = results
    .map((r) => {
      const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})-(\d{1,2}):/.exec(r.category);
      return m
        ? {
            day: Date.UTC(+m[3], +m[2] - 1, +m[1]),
            hour: +m[4],
            count: r.count,
          }
        : null;
    })
    .filter((r) => r !== null && r.count > 0) as {
    day: number;
    hour: number;
    count: number;
  }[];
  if (parsed.length === 0) return null;

  const latest = Math.max(...parsed.map((r) => r.day));
  const recent = ALL_DAYS
    ? parsed
    : parsed.filter((r) => latest - r.day < TIME_WINDOW_DAYS * DAY_MS);
  const days = [...new Set(recent.map((r) => r.day))]
    .sort((a, b) => a - b)
    .slice(-MAX_TIME_DAYS);
  const shown = recent.filter((r) => days.includes(r.day));

  // One axis for all days; hours without registrations stay as empty columns.
  const from = Math.min(...shown.map((r) => r.hour));
  const to = Math.max(...shown.map((r) => r.hour));
  const hours: number[] = [];
  for (let h = from; h <= to; h++) hours.push(h);

  // Days from different years carry the year, so the rows stay unambiguous.
  const years = new Set(days.map((d) => new Date(d).getUTCFullYear()));
  const label = years.size > 1 ? dayYearLabel : dayLabel;
  const rows = days.map((day) => ({
    label: label.format(day),
    counts: hours.map((h) =>
      shown
        .filter((r) => r.day === day && r.hour === h)
        .reduce((s, r) => s + r.count, 0)
    ),
  }));
  return {
    kind: 'time',
    dates: dateRange.formatRange(days[0], days[days.length - 1]),
    hours: hours.map((h) => `${h % 24}–${(h + 1) % 24}`),
    days: rows,
    max: Math.max(...rows.flatMap((r) => r.counts)),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const ALL_DAYS = new URLSearchParams(location.search).get('days') === 'all';
const dayLabel = new Intl.DateTimeFormat('de-AT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const dayYearLabel = new Intl.DateTimeFormat('de-AT', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dateRange = new Intl.DateTimeFormat('de-AT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

function genderSlide(results: VisitorResult[]): Slide | null {
  const parts = results
    .filter((r) => r.count > 0)
    .map((r, i) => ({
      label: r.category,
      count: r.count,
      color: GENDER_COLORS[i % GENDER_COLORS.length],
    }));
  const total = sum(parts);
  return total > 0 ? { kind: 'gender', parts, total } : null;
}

function barSlide(slide: Slide & { kind: 'bars' }): Slide | null {
  return slide.bars.length > 0 ? slide : null;
}

/**
 * Sorted, without empty categories, at most MAX_BARS: the smallest are summed
 * up as "n weitere" (not "Andere", which is a real legacy category).
 */
function bars(
  results: VisitorResult[],
  toBar: (r: VisitorResult) => Bar = (r) => ({
    label: r.category,
    count: r.count,
  })
): Bar[] {
  const sorted = results
    .filter((r) => r.count > 0)
    .map(toBar)
    .sort((a, b) => b.count - a.count);
  if (sorted.length <= MAX_BARS) return sorted;
  const rest = sorted.slice(MAX_BARS - 1);
  return [
    ...sorted.slice(0, MAX_BARS - 1),
    { label: `${rest.length} weitere`, count: sum(rest), color: NEUTRAL },
  ];
}

function sum(items: { count: number }[]): number {
  return items.reduce((s, r) => s + r.count, 0);
}
