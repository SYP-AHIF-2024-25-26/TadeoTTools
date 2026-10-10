/** One category of a legacy statistics endpoint (`GET /api/Visitors/<path>`). */
export interface VisitorResult {
  category: string;
  count: number;
}

/** `GET /api/Visitors/count`: registered visitors and the adults who came with them. */
export interface VisitorCount {
  count: number;
  adultsCount: number;
}

/** Everything the slideshow shows, as last loaded from the backend. */
export interface Statistics {
  count: VisitorCount;
  byTime: VisitorResult[];
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
  | { kind: 'time'; date: string; hours: Bar[]; peak: number }
  | {
      kind: 'bars';
      id: 'departments' | 'reasons' | 'schoolTypes' | 'districts';
      title: string;
      note?: string;
      bars: Bar[];
      /** Value text after the number, e.g. "Gemeinden". */
      unit?: { one: string; many: string };
      /** Share of this total shown after the value. */
      percentOf?: number;
    }
  | { kind: 'gender'; parts: Bar[]; total: number };
