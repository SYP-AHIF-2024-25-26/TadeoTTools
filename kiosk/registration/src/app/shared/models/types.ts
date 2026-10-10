/** A town from the legacy backend (`GET /api/Cities`). Several towns can share a postcode. */
export interface City {
  id: number;
  name: string;
  zipCode: string;
}

/** `GET /api/Visitors/count`: registered visitors and the adults who came with them. */
export interface VisitorCount {
  count: number;
  adultsCount: number;
}

/** The branches a visitor can tick; each one is a flag in `POST /api/Visitors`. */
export type InterestKey =
  | 'interestedInInformatik'
  | 'interestedInMedientechnik'
  | 'interestedInElektronik'
  | 'interestedInMedizintechnik'
  | 'interestedInFachschuleElektronik'
  | 'interestedInAbendschule'
  | 'interestedInKolleg';

/** Body of `POST /api/Visitors` (the backend's `AddVisitorDto`); the response is the new id. */
export type VisitorSubmission = {
  cityId: number;
  isMale: boolean;
  adults: number;
  schoolLevel: number;
  schoolType: string;
  reasonForVisit: string;
  comment: string | null;
  usePhoto: boolean;
  /** The photo as a PNG data URL; the backend stores it as `Visitor_<id>.png`. */
  photoFileName: string | null;
} & Record<InterestKey, boolean>;

/** What has been entered for the visitor at the tablet so far. */
export interface Draft {
  zip: string;
  cityId: number | null;
  isMale: boolean | null;
  schoolLevel: number | null;
  schoolType: string | null;
  adults: number | null;
  reason: string | null;
  comment: string;
  interests: readonly InterestKey[];
  usePhoto: boolean | null;
  photo: string | null;
}

export const EMPTY_DRAFT: Draft = {
  zip: '',
  cityId: null,
  isMale: null,
  schoolLevel: null,
  schoolType: null,
  adults: null,
  reason: null,
  comment: '',
  interests: [],
  usePhoto: null,
  photo: null,
};

/** Why a request to the backend failed. */
export type LoadFailure = 'no-network' | 'server';
