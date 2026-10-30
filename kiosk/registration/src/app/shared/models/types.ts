/** A town (`GET /v1/cities`). Several towns can share a postcode. The ids are the legacy ones. */
export interface City {
  id: number;
  name: string;
  zipCode: string;
}

/** `GET /v1/visitors/count`: registered visitors and the adults who came with them. */
export interface VisitorCount {
  count: number;
  adultsCount: number;
}

/** `GET /v1/registration-options`: the two choice lists, each in kiosk order. */
export interface RegistrationOptions {
  reasonsForVisit: string[];
  schoolTypes: string[];
}

/** "keine Angabe" is `NotStated`. */
export type Gender = 'Male' | 'Female' | 'NotStated';

/** The branches a visitor can tick; each one is a flag in `POST /v1/visitors`. */
export type InterestKey =
  | 'interestedInInformatik'
  | 'interestedInMedientechnik'
  | 'interestedInElektronik'
  | 'interestedInMedizintechnik'
  | 'interestedInFachschuleElektronik'
  | 'interestedInAbendschule'
  | 'interestedInKolleg';

/** Body of `POST /v1/visitors` (the backend's `AddVisitorDto`); the response is the new id. */
export type VisitorSubmission = {
  cityId: number;
  gender: Gender;
  adults: number;
  schoolLevel: number;
  schoolType: string;
  reasonForVisit: string;
  comment: string | null;
  /** The photo as a PNG data URL, null without one; the backend stores it as `Visitor_<id>.png`. */
  photo: string | null;
} & Record<InterestKey, boolean>;

/** What has been entered for the visitor at the tablet so far. */
export interface Draft {
  zip: string;
  cityId: number | null;
  gender: Gender | null;
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
  gender: null,
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

/** Where the school login stands; only 'granted' shows the registration. */
export type AccessState =
  'checking' | 'logged-out' | 'granted' | 'denied' | LoadFailure;

/** `GET /v1/users/is-registrar`; the class is empty for teachers. */
export interface KioskUser {
  name: string;
  studentClass: string;
}
