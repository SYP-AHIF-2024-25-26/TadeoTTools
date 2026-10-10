import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { ReferenceDataService } from '@core/services/reference-data.service';
import { VisitorCountService } from '@core/services/visitor-count.service';
import { WakeLockService } from '@core/services/wake-lock.service';
import { StartPageComponent } from '@pages/start/start-page.component';
import { FormPageComponent } from '@pages/form/form-page.component';
import { ReviewPageComponent } from '@pages/review/review-page.component';
import { DonePageComponent } from '@pages/done/done-page.component';
import { IdleGuardComponent } from '@shared/components/idle-guard.component';
import { StatusBarComponent } from '@shared/components/status-bar.component';

/**
 * The kiosk has no routes: the tablet always shows the step of the running
 * registration, so a reload or the browser's back button cannot jump into
 * the middle of someone's details.
 */
@Component({
  selector: 'app-root',
  imports: [
    StartPageComponent,
    FormPageComponent,
    ReviewPageComponent,
    DonePageComponent,
    IdleGuardComponent,
    StatusBarComponent,
  ],
  template: `
    <app-status-bar />
    <div class="min-h-0 flex-1">
      @switch (session.step()) {
        @case ('start') {
          <app-start-page />
        }
        @case ('form') {
          <app-form-page />
        }
        @case ('review') {
          <app-review-page />
        }
        @case ('done') {
          <app-done-page />
        }
      }
    </div>
    <app-idle-guard />
  `,
  host: { class: 'flex h-dvh flex-col select-none text-gray-800' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected session = inject(RegistrationSessionService);
  private swUpdate = inject(SwUpdate);
  private updateReady = signal(false);

  constructor() {
    inject(WakeLockService).keepAwake();
    inject(ReferenceDataService).load();
    inject(VisitorCountService).start();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateReady.set(true);
      });
    }

    // A new version is only applied between two visitors, never mid-registration.
    effect(() => {
      if (this.updateReady() && this.session.step() === 'start') {
        document.location.reload();
      }
    });
  }
}
