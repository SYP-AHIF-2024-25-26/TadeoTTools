import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { FeatureFlagService } from '@/core/services/feature-flag.service';
import { errorText, ToastService } from '@/core/services/toast.service';

// Users & Data > Visitor App: settings the public GuideApp reads (countdown).
@Component({
  selector: 'app-visitor-app-settings',
  imports: [FormsModule],
  templateUrl: './visitor-app-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorAppSettingsComponent implements OnInit {
  private featureFlagService = inject(FeatureFlagService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  loading = signal(true);
  showCountdown = signal(false);
  countdownValue = signal('');
  // The date as stored, so Save Date is only enabled after a change.
  savedValue = signal('');

  async ngOnInit() {
    try {
      const flag = await this.featureFlagService.getShowCountdown();
      this.showCountdown.set(flag.isEnabled);
      this.countdownValue.set(flag.value);
      this.savedValue.set(flag.value);
    } catch (e) {
      console.error('Failed to load feature flag', e);
      this.toast.error('The countdown settings could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  // Same confirmation as the switch on the Overview.
  async toggleCountdown(event: Event) {
    const input = event.target as HTMLInputElement;
    const enable = !this.showCountdown();
    // Keep the switch where it was until the change is confirmed and saved.
    input.checked = this.showCountdown();

    const confirmed = await this.confirmDialog.confirm(
      enable
        ? {
            title: 'Show the Countdown?',
            message:
              'Visitors will see a countdown to the next open day instead of the tour. Turn this on once the open day is over.',
            confirmLabel: 'Show Countdown',
            tone: 'primary',
          }
        : {
            title: 'Show the Tour?',
            message:
              'Visitors will see the tour with all public stop groups instead of the countdown.',
            confirmLabel: 'Show Tour',
            tone: 'primary',
          }
    );
    if (!confirmed) return;

    try {
      await this.featureFlagService.updateShowCountdown(
        enable,
        this.savedValue()
      );
      this.showCountdown.set(enable);
      this.toast.success(
        enable
          ? 'The countdown is now shown in the visitor app.'
          : 'The countdown is now hidden in the visitor app.'
      );
    } catch (e) {
      console.error('Failed to update feature flag', e);
      this.toast.error(
        errorText(e, 'The countdown setting could not be saved.')
      );
    }
  }

  async saveCountdownDate() {
    try {
      await this.featureFlagService.updateShowCountdown(
        this.showCountdown(),
        this.countdownValue()
      );
      this.savedValue.set(this.countdownValue());
      this.toast.success('Countdown date saved.');
    } catch (e) {
      console.error('Failed to update countdown value', e);
      this.toast.error(errorText(e, 'The countdown date could not be saved.'));
    }
  }
}
