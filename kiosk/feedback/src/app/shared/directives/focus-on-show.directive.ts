import {
  afterNextRender,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
} from '@angular/core';

/**
 * Moves the focus to the host (a page heading) when it appears and whenever
 * `appFocusOnShow` changes, e.g. on the next question. Without it the focus
 * falls back to the page body on every step and screen readers announce nothing.
 */
@Directive({
  selector: '[appFocusOnShow]',
  host: { tabindex: '-1', class: 'focus-visible:outline-none' },
})
export class FocusOnShowDirective {
  readonly appFocusOnShow = input<unknown>();

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);

  constructor() {
    effect(() => {
      this.appFocusOnShow();
      afterNextRender(
        () => {
          // Never take the focus away from an open dialog.
          if (!document.querySelector('[aria-modal="true"]')) {
            this.host.nativeElement.focus({ preventScroll: true });
          }
        },
        { injector: this.injector }
      );
    });
  }
}
