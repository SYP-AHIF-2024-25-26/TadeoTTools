import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DialogComponent } from './dialog.component';
import { OutboxService } from '@core/services/outbox.service';
import { euro } from '@shared/money';

const timeFormat = new Intl.DateTimeFormat('de-AT', {
  hour: '2-digit',
  minute: '2-digit',
});

/** The backend answers 400 for a product no longer on the menu and 404 for a deleted buffet. */
function reason(status: number | undefined): string {
  if (status === 404) return 'Buffet nicht mehr vorhanden';
  if (status === 400)
    return 'Ein Produkt ist nicht mehr vorhanden oder geändert';
  return `Vom Server abgelehnt (Fehler ${status ?? '?'})`;
}

/**
 * Sales the server refused. They are money already in the cash box, so they
 * stay until the student sends them again or removes one on purpose.
 */
@Component({
  selector: 'app-rejected-dialog',
  imports: [DialogComponent],
  template: `
    <app-dialog
      labelledBy="rejected-title"
      describedBy="rejected-text"
      [wide]="true"
      (dismiss)="closed.emit()"
    >
      @if (removing(); as sale) {
        <h2 id="rejected-title" class="text-2xl font-bold">
          Verkauf {{ sale.number }} entfernen?
        </h2>
        <p id="rejected-text" class="mt-3 text-lg text-gray-600">
          {{ sale.time }} Uhr, {{ sale.total }}. Er wird nicht mehr übertragen
          und fehlt in der Statistik. Vorher bitte auf Papier notieren.
        </p>
        <div class="mt-8 flex flex-wrap justify-end gap-4">
          <button
            type="button"
            class="btn-keep"
            data-initial-focus
            (click)="ask(null)"
          >
            Behalten
          </button>
          <button
            type="button"
            class="btn-danger"
            (click)="remove(sale.number)"
          >
            Entfernen
          </button>
        </div>
      } @else {
        <h2 id="rejected-title" class="text-2xl font-bold">
          Nicht übertragbare Verkäufe
        </h2>
        <p id="rejected-text" class="mt-2 text-lg text-gray-600">
          Der Server hat diese Verkäufe abgelehnt. Sie sind auf dem Tablet
          gespeichert und im Kassastand enthalten. Bitte der Lehrkraft am Buffet
          Bescheid geben und danach erneut senden.
        </p>
        <ul class="-mx-2 mt-5 min-h-0 flex-1 overflow-y-auto px-2">
          @for (sale of sales(); track sale.number) {
            <li
              class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 py-3"
            >
              <div class="min-w-0 flex-1">
                <p class="text-lg font-medium text-gray-900">
                  {{ sale.time }} Uhr · {{ sale.total }}
                </p>
                <p class="text-base text-gray-700">{{ sale.items }}</p>
                <p class="text-base text-red-700">{{ sale.reason }}</p>
                <!-- For whoever checks the dashboard: the order number and the server's own words -->
                <p class="line-clamp-2 text-sm text-gray-600" lang="en">
                  <span lang="de">Nr. {{ sale.number }}</span>
                  @if (sale.detail) {
                    · {{ sale.detail }}
                  }
                </p>
              </div>
              <button
                type="button"
                class="h-12 rounded-xl px-4 text-base font-medium text-red-700 hover:bg-red-50"
                (click)="ask(sale)"
              >
                Entfernen …
              </button>
            </li>
          }
        </ul>
        <div class="mt-6 flex flex-wrap justify-end gap-4">
          <button type="button" class="btn-keep" (click)="closed.emit()">
            Schließen
          </button>
          <button
            type="button"
            class="btn-primary sm:h-14"
            data-initial-focus
            (click)="retry()"
          >
            Erneut senden
          </button>
        </div>
      }
    </app-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RejectedDialogComponent {
  readonly closed = output();

  private outbox = inject(OutboxService);
  private dialog = viewChild.required(DialogComponent);

  protected sales = computed(() =>
    this.outbox.rejected().map((s) => ({
      number: s.order.orderNumber,
      time: timeFormat.format(new Date(s.order.date)),
      total: euro(s.total),
      items: s.lines.map((l) => `${l.amount} × ${l.name}`).join(', '),
      reason: reason(s.rejected?.status),
      detail: s.rejected?.message ?? '',
    }))
  );
  protected removing = signal<{
    number: string;
    time: string;
    total: string;
  } | null>(null);

  protected ask(
    sale: { number: string; time: string; total: string } | null
  ): void {
    this.removing.set(sale);
    this.dialog().focusInitial();
  }

  protected remove(orderNumber: string): void {
    this.outbox.discard(orderNumber);
    this.removing.set(null);
    if (this.outbox.rejected().length === 0) this.closed.emit();
    else this.dialog().focusInitial();
  }

  protected retry(): void {
    this.outbox.retryRejected();
    this.closed.emit();
  }
}
