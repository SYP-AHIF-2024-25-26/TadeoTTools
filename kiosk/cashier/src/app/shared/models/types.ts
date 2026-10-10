/** A product as sold at one buffet. Prices are in cents, as in the legacy backend. */
export interface Product {
  id: number;
  name: string;
  /** Cents; negative for a voucher ("Gutschein"). */
  price: number;
  /** Unit shown under the name ("Stück", "Becher", "Teller"); may be empty. */
  measure: string;
  /** Order at the counter, as set in the legacy admin. */
  rank: number;
}

export interface Buffet {
  id: number;
  /** Short location code, at most 3 characters ("OG"). */
  location: string;
  products: Product[];
}

/** A product in the cart, with how many of it. */
export interface CartLine {
  product: Product;
  amount: number;
}

/** `POST /api/orders` body of the legacy backend. */
export interface OrderSubmission {
  buffetId: number;
  /** ISO time the sale was completed (not when it was sent). */
  date: string;
  soldUnits: { productId: number; amount: number }[];
  /** Unique per sale (device id + sequence), so a duplicate can be found later. */
  orderNumber: string;
}

/** A completed sale that is not on the server yet. */
export interface PendingSale {
  order: OrderSubmission;
  /** Kept for the student: what was sold and for how much. */
  lines: { name: string; amount: number }[];
  total: number;
  /** Set when the server refused the sale; it then waits for the student. */
  rejected?: { status: number; message: string };
}

/** The sale just completed, shown on the till until the next product is tapped. */
export interface LastSale {
  total: number;
  given: number | null;
  orderNumber: string;
}

/** Sales completed on this tablet since the last reset ("Kassastand"). */
export interface TillTotal {
  since: string;
  count: number;
  cents: number;
}

/** Why loading failed: no connection at all, or the backend answered with an error. */
export type LoadFailure = 'no-network' | 'server';
