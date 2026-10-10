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
import { TillTotalService } from '@core/services/till-total.service';
import { OutboxService } from '@core/services/outbox.service';
import { euro } from '@shared/money';

const sinceFormat = new Intl.DateTimeFormat('de-AT', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** "Kassastand": what this tablet took since the last reset, for counting the cash box. */
@Component({
  selector: 'app-till-total-dialog',
  imports: [DialogComponent],
  template: `
    <app-dialog
      labelledBy="till-title"
      describedBy="till-text"
      (dismiss)="closed.emit()"
    >
      @if (!confirming()) {
        <h2 id="till-title" class="text-2xl font-bold">
          Kassastand dieses Tablets
        </h2>
        <p id="till-text" class="mt-1 text-lg text-gray-600">
          Seit {{ since() }} Uhr
        </p>
        <p
          class="mt-6 text-6xl font-bold tabular-nums tracking-tight text-gray-900"
        >
          {{ sum() }}
        </p>
        <p class="mt-2 text-xl text-gray-700">
          {{ count() === 1 ? '1 Verkauf' : count() + ' Verkäufe' }}
        </p>
        @if (unsent() > 0) {
          <p class="mt-4 text-lg text-gray-600">
            {{
              unsent() === 1
                ? '1 Verkauf ist noch nicht übertragen.'
                : unsent() + ' Verkäufe sind noch nicht übertragen.'
            }}
          </p>
        }
        <div class="mt-8 flex flex-wrap justify-end gap-4">
          <button
            type="button"
            class="h-14 rounded-2xl px-6 text-lg font-medium text-gray-700 hover:bg-gray-100"
            (click)="confirm(true)"
          >
            Auf 0 setzen …
          </button>
          <button
            type="button"
            class="h-14 rounded-2xl bg-gray-100 px-6 text-lg font-medium text-gray-800 hover:bg-gray-200"
            data-initial-focus
            (click)="closed.emit()"
          >
            Schließen
          </button>
        </div>
      } @else {
        <h2 id="till-title" class="text-2xl font-bold">
          Kassastand auf 0 setzen?
        </h2>
        <p id="till-text" class="mt-3 text-lg text-gray-600">
          Danach zählt das Tablet wieder von vorne, z. B. für die nächste
          Schicht. Die Verkäufe selbst bleiben gespeichert und werden weiter
          übertragen.
        </p>
        <div class="mt-8 flex flex-wrap justify-end gap-4">
          <button
            type="button"
            class="h-14 rounded-2xl bg-gray-100 px-6 text-lg font-medium text-gray-800 hover:bg-gray-200"
            data-initial-focus
            (click)="confirm(false)"
          >
            Zurück
          </button>
          <button
            type="button"
            class="h-14 rounded-2xl bg-red-700 px-6 text-lg font-medium text-white shadow-md hover:bg-red-800"
            (click)="reset()"
          >
            Auf 0 setzen
          </button>
        </div>
      }
    </app-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TillTotalDialogComponent {
  readonly closed = output();

  private tillTotal = inject(TillTotalService);
  private outbox = inject(OutboxService);

  private dialog = viewChild.required(DialogComponent);
  protected confirming = signal(false);
  protected since = computed(() =>
    sinceFormat.format(new Date(this.tillTotal.total().since))
  );
  protected sum = computed(() => euro(this.tillTotal.total().cents));
  protected count = computed(() => this.tillTotal.total().count);
  protected unsent = computed(
    () => this.outbox.waiting().length + this.outbox.rejected().length
  );

  protected confirm(asking: boolean): void {
    this.confirming.set(asking);
    this.dialog().focusInitial();
  }

  protected reset(): void {
    this.tillTotal.reset();
    this.confirm(false);
  }
}
