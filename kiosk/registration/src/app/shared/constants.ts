import { InterestKey } from './models/types';

/** localStorage key of the towns, reasons and school types last loaded from the backend. */
export const REFERENCE_CACHE_KEY = 'tadeot-registration-reference';

/** Retry interval while the tablet has no reference data at all (first start without Wi-Fi). */
export const REFERENCE_RETRY_MS = 30000;

/** How often the visitor counter in the status strip is refreshed. */
export const COUNT_REFRESH_MS = 30000;

/** How long saving a registration may take; a photo makes the request large. */
export const SAVE_TIMEOUT_MS = 20000;

/** How long the thank-you screen (no photo) stays before the next registration. */
export const THANKS_SCREEN_MS = 5000;

/** Pause after tapping a reason so the selection is visible before moving on. */
export const AUTO_ADVANCE_MS = 500;

/** Time without any input on a step or the overview before "Noch da?" appears. */
export const IDLE_WARNING_MS = 75000;

/** Seconds the "Noch da?" dialog counts down before the registration is discarded. */
export const IDLE_COUNTDOWN_S = 15;

/** The reason that asks for a free-text comment. */
export const OTHER_REASON = 'Anderes';

/** Austrian postcodes have four digits. */
export const ZIP_LENGTH = 4;

/** Selectable school years ("Schulstufe"); the legacy app offered the same range. */
export const SCHOOL_LEVELS = [7, 8, 9, 10, 11, 12, 13] as const;

/** Adults who came along; the legacy app offered the same range. */
export const ADULT_COUNTS = [0, 1, 2, 3, 4] as const;

/** The branches, in the two groups the legacy app showed. */
export const INTEREST_GROUPS: readonly {
  title: string;
  options: readonly { key: InterestKey; label: string }[];
}[] = [
  {
    title: 'Tagesschulzweige',
    options: [
      { key: 'interestedInInformatik', label: 'Informatik' },
      { key: 'interestedInMedientechnik', label: 'Medientechnik' },
      { key: 'interestedInElektronik', label: 'Elektronik' },
      { key: 'interestedInMedizintechnik', label: 'Medizintechnik' },
    ],
  },
  {
    title: 'Praxisspezifische Ausbildungen',
    options: [
      {
        key: 'interestedInFachschuleElektronik',
        label: 'Fachschule Elektronik',
      },
      { key: 'interestedInAbendschule', label: 'Abendschule' },
      { key: 'interestedInKolleg', label: 'Kolleg' },
    ],
  },
];

/** localStorage key of the camera chosen last on this tablet. */
export const CAMERA_KEY = 'tadeot-registration-camera';

/** How long a started camera may take to deliver its first frame. */
export const CAMERA_FRAME_TIMEOUT_MS = 5000;

/** Time a camera gets to adjust its exposure before its picture counts as black. */
export const CAMERA_SETTLE_MS = 1200;

/** Size of the stored photo: portrait 3:4, enough for a licence card, small enough to upload fast. */
export const PHOTO_WIDTH = 480;
export const PHOTO_HEIGHT = 640;
