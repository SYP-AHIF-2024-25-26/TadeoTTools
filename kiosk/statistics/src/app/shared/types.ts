/** One bar of a statistics slide. */
export interface VisitorResult {
  category: string;
  count: number;
}

/** Registrations in one hour, Vienna time: hour 14 on "2026-11-20" is 14–15 Uhr. */
export interface VisitorHour {
  date: string;
  hour: number;
  count: number;
}

/** Registered visitors and the adults who came with them. */
export interface VisitorCount {
  count: number;
  adultsCount: number;
}

/** `GET /v1/visitor-statistics`: everything the slideshow shows, as last loaded. */
export interface Statistics {
  count: VisitorCount;
  byTime: VisitorHour[];
  departments: VisitorResult[];
  reasons: VisitorResult[];
  schoolTypes: VisitorResult[];
  districts: VisitorResult[];
  gender: VisitorResult[];
}

export type StatisticsKey = keyof Statistics;

/** A bar of a bar chart, already labelled for the wall. */
export interface Bar {
  label: string;
  count: number;
  /** Fill colour of the bar; the label and value always stay in ink. */
  color?: string;
}

export type Slide =
  | { kind: 'total'; registered: number; withCompany: number }
  | {
      kind: 'time';
      /** "21.–22. November 2025" */
      dates: string;
      /** Column labels of the shared hour axis, e.g. "14–15". */
      hours: string[];
      /** One row per day, oldest first; counts line up with `hours`. */
      days: { label: string; counts: number[] }[];
      /** Largest count of all days: the rows share one scale. */
      max: number;
    }
  | {
      kind: 'bars';
      id: 'departments' | 'reasons' | 'schoolTypes' | 'districts';
      title: string;
      note?: string;
      bars: Bar[];
      /** Share of this total shown after the value. */
      percentOf?: number;
    }
  | { kind: 'gender'; parts: Bar[]; total: number };
