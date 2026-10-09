/** localStorage key of the last questionnaire loaded from the backend. */
export const QUESTIONS_CACHE_KEY = 'tadeot-feedback-questions';

/** localStorage key of finished feedback that still has to be sent. */
export const OUTBOX_KEY = 'tadeot-feedback-outbox';

/** How long the thank-you screen stays before the tablet is ready for the next visitor. */
export const THANKS_SCREEN_MS = 5000;

/** Retry interval for feedback that could not be sent. */
export const OUTBOX_RETRY_MS = 30000;

/** Pause after tapping a single choice or rating so the selection is visible. */
export const AUTO_ADVANCE_MS = 250;
