import { computed, inject, Injectable, signal } from '@angular/core';
import { CatalogService } from './catalog.service';
import { CartLine, Product } from '@shared/models/types';
import { MAX_AMOUNT } from '@shared/constants';

/** The sale being put together at the counter. */
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private catalog = inject(CatalogService);
  /** Amount per product id. */
  private amounts = signal<ReadonlyMap<number, number>>(new Map());

  /**
   * Lines in counter order, built from the current product list: a price
   * changed in the admin applies at once, a removed product drops out.
   */
  readonly lines = computed<CartLine[]>(() => {
    const amounts = this.amounts();
    return (this.catalog.buffet()?.products ?? [])
      .filter((p) => (amounts.get(p.id) ?? 0) > 0)
      .map((product) => ({ product, amount: amounts.get(product.id) ?? 0 }));
  });
  readonly total = computed(() =>
    this.lines().reduce((sum, l) => sum + l.amount * l.product.price, 0)
  );
  /** Items without vouchers. */
  readonly itemCount = computed(() =>
    this.lines()
      .filter((l) => l.product.price >= 0)
      .reduce((sum, l) => sum + l.amount, 0)
  );
  readonly empty = computed(() => this.lines().length === 0);
  /** Why the sale cannot be paid yet; null when it can. */
  readonly problem = computed<string | null>(() => {
    if (this.empty()) return null;
    if (this.itemCount() === 0)
      return 'Gutschein nur zusammen mit einem Einkauf';
    if (this.total() < 0) return 'Der Gutschein ist mehr wert als der Einkauf';
    return null;
  });
  readonly payable = computed(() => !this.empty() && this.problem() === null);

  amount(product: Product): number {
    return this.amounts().get(product.id) ?? 0;
  }

  /** Vouchers count once per sale, as in the legacy app: a second tap takes it out again. */
  add(product: Product): void {
    const current = this.amount(product);
    if (isVoucher(product)) {
      this.set(product, current > 0 ? 0 : 1);
    } else if (current < MAX_AMOUNT) {
      this.set(product, current + 1);
    }
  }

  remove(product: Product): void {
    this.set(product, Math.max(0, this.amount(product) - 1));
  }

  clear(): void {
    this.amounts.set(new Map());
  }

  private set(product: Product, amount: number): void {
    this.amounts.update((amounts) => {
      const next = new Map(amounts);
      if (amount > 0) next.set(product.id, amount);
      else next.delete(product.id);
      return next;
    });
  }
}

export function isVoucher(product: Product): boolean {
  return product.price < 0;
}
