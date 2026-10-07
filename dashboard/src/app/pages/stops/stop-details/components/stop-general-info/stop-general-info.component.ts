import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Stop } from '@/shared/models/types';

// Text limits of the stop form. The backend allows more for name and
// description (100 / 500); these are the dashboard's own limits.
export const STOP_LIMITS = {
  name: 50,
  description: 255,
  roomNr: 50,
  infrastructure: 500,
} as const;

type RequiredField = 'name' | 'description' | 'roomNr';

const MISSING: Record<RequiredField, string> = {
  name: 'Enter a name.',
  description: 'Enter a description.',
  roomNr: 'Enter a room number.',
};

/** Error per required field, or null when the stop's text fields are valid. */
export function stopFieldErrors(
  stop: Stop
): Partial<Record<RequiredField, string>> | null {
  const errors: Partial<Record<RequiredField, string>> = {};
  for (const field of Object.keys(MISSING) as RequiredField[]) {
    const value = (stop[field] ?? '').trim();
    if (value.length === 0) {
      errors[field] = MISSING[field];
    } else if (value.length > STOP_LIMITS[field]) {
      errors[field] = `Use at most ${STOP_LIMITS[field]} characters.`;
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

@Component({
  selector: 'app-stop-general-info',
  imports: [FormsModule],
  templateUrl: './stop-general-info.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopGeneralInfoComponent {
  stop = model.required<Stop>();
  // Set by the editor after a save attempt, so errors don't show while typing
  // into an empty new stop.
  showErrors = input<boolean>(false);

  protected readonly limits = STOP_LIMITS;

  length(value: string | undefined | null): number {
    return (value ?? '').length;
  }

  // The counter turns orange in the last 10% before the limit.
  counterClass(value: string | undefined | null, limit: number): string {
    return this.length(value) >= limit * 0.9
      ? 'text-orange-700 dark:text-orange-400'
      : 'text-text-700';
  }

  error(field: RequiredField): string | undefined {
    return this.showErrors()
      ? stopFieldErrors(this.stop())?.[field]
      : undefined;
  }
}
