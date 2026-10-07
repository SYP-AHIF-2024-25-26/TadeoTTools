import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component
) => {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return inject(ConfirmDialogService).confirm({
    title: 'Unsaved changes',
    message: 'You have changes that are not saved yet. Leave and discard them?',
    confirmLabel: 'Discard changes',
    cancelLabel: 'Keep editing',
  });
};
