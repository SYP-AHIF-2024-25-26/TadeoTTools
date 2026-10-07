import {
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
};

// Opens the shared confirmation dialog from code (e.g. route guards) and
// resolves with the user's choice.
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const ref = createComponent(DeletePopupComponent, {
        environmentInjector: this.injector,
      });
      ref.setInput('title', options.title);
      ref.setInput('message', options.message);
      ref.setInput('confirmLabel', options.confirmLabel);
      ref.setInput('cancelLabel', options.cancelLabel ?? 'Cancel');
      ref.setInput('tone', options.tone ?? 'danger');

      const previousFocus = document.activeElement as HTMLElement | null;
      const close = (result: boolean) => {
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        previousFocus?.focus();
        resolve(result);
      };
      ref.instance.removeConfirmed.subscribe(() => close(true));
      ref.instance.cancel.subscribe(() => close(false));

      document.body.appendChild(ref.location.nativeElement);
      this.appRef.attachView(ref.hostView);
    });
  }
}
