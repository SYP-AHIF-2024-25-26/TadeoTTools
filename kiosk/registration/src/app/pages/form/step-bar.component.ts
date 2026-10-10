import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FORM_STEPS } from '@core/services/registration-session.service';

/** The five named steps; done ones filled, the current one in full orange. */
@Component({
  selector: 'app-step-bar',
  template: `
    <ol class="grid grid-cols-5 gap-2 sm:gap-3" aria-label="Schritte">
      @for (step of steps; track step.id; let i = $index) {
        <li [attr.aria-current]="i === current() ? 'step' : null">
          <span
            class="block h-2 rounded-full transition-colors duration-300"
            [class.bg-accent-500]="i === current()"
            [class.bg-accent-300]="i < current()"
            [class.bg-gray-200]="i > current()"
          ></span>
          <span
            class="mt-1.5 hidden truncate text-base sm:block"
            [class.font-bold]="i === current()"
            [class.text-gray-900]="i === current()"
            [class.text-gray-600]="i !== current()"
          >
            {{ step.label }}
            @if (i < current()) {
              <span class="sr-only">(erledigt)</span>
            }
          </span>
        </li>
      }
    </ol>
    <!-- Phones: the names do not fit next to each other -->
    <p class="mt-1.5 text-base font-medium text-gray-700 sm:hidden">
      Schritt {{ current() + 1 }} von {{ steps.length }}:
      {{ steps[current()].label }}
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepBarComponent {
  readonly current = input.required<number>();
  protected steps = FORM_STEPS;
}
