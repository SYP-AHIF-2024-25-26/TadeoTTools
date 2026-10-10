/** localStorage key of the buffets and products last loaded from the backend. */
export const CATALOG_CACHE_KEY = 'tadeot-cashier-catalog';

/** localStorage key of the buffet chosen on this tablet (only asked when there are several). */
export const BUFFET_KEY = 'tadeot-cashier-buffet';

/** localStorage key of the completed sales not yet accepted by the backend. */
export const OUTBOX_KEY = 'tadeot-cashier-outbox';

/** localStorage key of this tablet's till total ("Kassastand"). */
export const TILL_TOTAL_KEY = 'tadeot-cashier-till-total';

/** localStorage keys of this tablet's id and sale counter, which make up the order number. */
export const DEVICE_ID_KEY = 'tadeot-cashier-device';
export const SEQUENCE_KEY = 'tadeot-cashier-sequence';

/** Retry interval while the tablet has no products at all (first start without Wi-Fi). */
export const CATALOG_RETRY_MS = 30000;

/** Prices may be changed in the legacy admin during the day; the till picks that up. */
export const CATALOG_REFRESH_MS = 5 * 60000;

/** Retry interval for sales that could not be sent. */
export const OUTBOX_RETRY_MS = 30000;

/** How long sending one sale may take before it counts as failed (and is retried). */
export const SEND_TIMEOUT_MS = 10000;

/** Most of one product in one sale. */
export const MAX_AMOUNT = 99;

/** Quick amounts for the cash handed over, in cents. */
export const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

/** Longest amount that can be typed on the pad: 9999,99 €. */
export const MAX_EURO_DIGITS = 4;
