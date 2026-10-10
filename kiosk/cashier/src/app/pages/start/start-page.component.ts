import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { CatalogService } from '@core/services/catalog.service';
import { moveFocus } from '@shared/radio-keys';

const timeFormat = new Intl.DateTimeFormat('de-AT', {
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * Before the till: the first load of the products (only once per tablet,
 * they are cached afterwards) and, when there are several buffets, which one
 * this tablet sells for.
 */
@Component({
  selector: 'app-start-page',
  imports: [NgOptimizedImage, FocusOnShowDirective],
  template: `
    <main
      class="flex flex-1 flex-col items-center justify-center gap-10 overflow-y-auto px-6 py-8 text-center short:gap-6"
    >
      <img
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="h-auto w-[min(60vw,24rem)]"
      />

      @if (ready()) {
        <div class="w-full max-w-xl">
          <h1
            id="buffet-title"
            class="text-balance text-3xl font-bold text-gray-800 md:text-4xl"
            appFocusOnShow
          >
            Für welches Buffet kassiert dieses Tablet?
          </h1>
          <div
            class="mt-8 grid gap-4 text-left"
            role="radiogroup"
            aria-labelledby="buffet-title"
          >
            @for (b of buffets(); track b.id) {
              <button
                type="button"
                role="radio"
                class="choice min-h-20 px-5 py-3"
                [attr.aria-checked]="b.id === current()"
                [attr.tabindex]="
                  b.id === current() || (current() === null && $first) ? 0 : -1
                "
                (click)="catalog.choose(b.id)"
                (keydown)="moveFocus($event)"
              >
                <span class="mark-radio" aria-hidden="true"></span>
                <span class="text-2xl font-bold text-gray-900"
                  >Buffet {{ b.location }}</span
                >
              </button>
            }
          </div>
          @if (current() !== null) {
            <button
              type="button"
              class="btn-secondary mx-auto mt-8"
              (click)="catalog.picking.set(false)"
            >
              Zurück zur Kassa
            </button>
          }
        </div>
      } @else {
        <h1
          class="text-balance text-4xl font-bold text-gray-800 md:text-5xl"
          appFocusOnShow
        >
          Buffet-Kassa
        </h1>
        @if (failure() === null) {
          <p
            class="flex h-20 items-center gap-3 text-xl text-gray-600"
            role="status"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7 motion-safe:animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                stroke-width="3"
                class="opacity-25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
            Produkte werden geladen …
          </p>
        } @else {
          <div class="max-w-lg" role="alert">
            <p class="text-xl font-medium text-gray-800">
              Die Produkte konnten nicht geladen werden.
            </p>
            <p class="mt-2 text-lg text-gray-600">
              @if (failure() === 'no-network') {
                Keine Verbindung zum Server. Bitte das WLAN des Tablets prüfen.
              } @else {
                Der Server meldet einen Fehler. Bitte kurz warten und erneut
                versuchen.
              }
            </p>
            <button
              type="button"
              class="btn-primary mx-auto mt-8 px-10"
              [disabled]="loading()"
              (click)="catalog.load()"
            >
              {{ loading() ? 'Verbinde …' : 'Erneut versuchen' }}
            </button>
            @if (lastAttempt(); as at) {
              <p class="mt-4 text-base text-gray-600">
                Zuletzt versucht um {{ at }} Uhr. Das Tablet versucht es alle 30
                Sekunden von selbst. Danach geht das Kassieren auch ohne
                Verbindung.
              </p>
            }
          </div>
        }
      }
    </main>
  `,
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPageComponent {
  protected catalog = inject(CatalogService);
  protected moveFocus = moveFocus;

  protected ready = this.catalog.ready;
  protected buffets = this.catalog.buffets;
  protected current = computed(() => this.catalog.buffet()?.id ?? null);
  protected loading = this.catalog.loading;
  protected failure = this.catalog.failure;
  protected lastAttempt = computed(() => {
    const at = this.catalog.lastAttempt();
    return at ? timeFormat.format(at) : null;
  });
}
