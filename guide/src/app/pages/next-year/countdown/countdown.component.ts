import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';

interface CountdownUnit {
  value: string;
  label: string;
}

/** Days to seconds until the next open day; nothing once it has started. */
@Component({
  selector: 'app-countdown',
  template: `
    @if (msLeft() > 0) {
      <!-- 2×2 and large: the countdown is the poster's centre, not a strip. -->
      <div class="grid grid-cols-2 gap-3" role="timer">
        @for (unit of units(); track unit.label) {
          <div
            class="flex flex-col items-center rounded-2xl bg-night-800/60 pb-3 pt-4 [@media(min-height:740px)]:pb-5 [@media(min-height:740px)]:pt-6"
          >
            <span
              class="text-[clamp(3rem,min(19vw,8svh),5.5rem)] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
              >{{ unit.value }}</span
            >
            <span class="mt-2 text-lg font-semibold text-night-200">{{
              unit.label
            }}</span>
          </div>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent implements OnInit {
  targetDate = input.required<Date>();

  private now = signal(Date.now());
  protected msLeft = computed(() => this.targetDate().getTime() - this.now());

  protected units = computed<CountdownUnit[]>(() => {
    const seconds = Math.max(0, Math.floor(this.msLeft() / 1000));
    const pad = (n: number) => n.toString().padStart(2, '0');
    return [
      { value: pad(Math.floor(seconds / 86400)), label: 'Tage' },
      { value: pad(Math.floor(seconds / 3600) % 24), label: 'Stunden' },
      { value: pad(Math.floor(seconds / 60) % 60), label: 'Minuten' },
      { value: pad(seconds % 60), label: 'Sekunden' },
    ];
  });

  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }
}
