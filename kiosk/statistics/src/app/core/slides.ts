import {
  DEPARTMENT_LABELS,
  DIVISION_COLORS,
  MAX_BARS,
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
 * Registrations per hour of the latest day in the data. Earlier open days
 * (and test registrations) are left out. The legacy backend already shifts
 * the hour to local winter time: "21.11.2025-14:00" is 14–15 Uhr.
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
  const day = parsed.filter((r) => r.day === latest);
  const from = Math.min(...day.map((r) => r.hour));
  const to = Math.max(...day.map((r) => r.hour));
  const hours: Bar[] = [];
  // Hours without registrations in between stay visible as empty columns.
  for (let h = from; h <= to; h++) {
    hours.push({
      label: `${h % 24}–${(h + 1) % 24}`,
      count: day.filter((r) => r.hour === h).reduce((s, r) => s + r.count, 0),
    });
  }
  return {
    kind: 'time',
    date: new Intl.DateTimeFormat('de-AT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(latest),
    hours,
    peak: Math.max(...hours.map((h) => h.count)),
  };
}

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
