import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';

const FOCUSABLE =
  'button:not([disabled]), [href], textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Shell of every kiosk dialog: scrim, panel, focus moved in on open, Tab kept
 * inside, Escape and a tap on the scrim dismiss, focus returned on close.
 * The element marked `data-initial-focus` gets the focus first.
 */
@Component({
  selector: 'app-dialog',
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      role="presentation"
      (click)="dismiss.emit()"
    >
      <div
        #panel
        class="relative w-full max-w-lg overflow-hidden rounded-lg bg-white p-8 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="labelledBy()"
        [attr.aria-describedby]="describedBy()"
        tabindex="-1"
        (click)="$event.stopPropagation()"
        (keydown)="onKeydown($event)"
      >
        <ng-content />
      </div>
    </div>
  `,
  host: { class: 'contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent implements OnDestroy {
  readonly labelledBy = input.required<string>();
  readonly describedBy = input.required<string>();
  /** Escape or a tap next to the panel; the dialog decides what that means. */
  readonly dismiss = output();

  private panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private returnFocus = document.activeElement as HTMLElement | null;

  constructor() {
    afterNextRender(() => {
      const panel = this.panel().nativeElement;
      const first =
        panel.querySelector<HTMLElement>('[data-initial-focus]') ??
        this.focusables()[0] ??
        panel;
      first.focus();
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dismiss.emit();
    } else if (event.key === 'Tab') {
      const items = this.focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || !items.includes(active as HTMLElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private focusables(): HTMLElement[] {
    return Array.from(
      this.panel().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE)
    );
  }

  ngOnDestroy(): void {
    // Not when the screen behind has changed (e.g. the feedback was discarded).
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
  }
}
