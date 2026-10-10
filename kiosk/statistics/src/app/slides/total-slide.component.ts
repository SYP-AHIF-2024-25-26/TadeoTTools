import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatCount } from '@shared/format';
import { Slide } from '@shared/types';

/** The headline number, set as a sentence: how many have registered so far. */
@Component({
  selector: 'app-total-slide',
  template: `
    <div class="flex h-full flex-col justify-center pb-[4vmin]">
      <p
        class="font-bold leading-[0.85] tracking-[-0.04em] text-gray-900"
        [style.font-size.vmin]="40"
      >
        {{ registered() }}
      </p>
      <span
        class="grow-x mt-[3.5vmin] block h-[2vmin] w-[28vmin] rounded-r-[1vmin] bg-accent-500"
        aria-hidden="true"
      ></span>
      <h1 class="slide-title mt-[3.5vmin]" [style.font-size.vmin]="9">
        {{ slide().registered === 1 ? 'hat' : 'haben' }} sich schon angemeldet.
      </h1>
      <p
        class="fade-in mt-[2.5vmin] text-gray-700"
        [style.font-size.vmin]="5.6"
      >
        Mit Begleitung sind das
        <span class="font-bold text-gray-900">{{ withCompany() }}</span>
        Gäste.
      </p>
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalSlideComponent {
  readonly slide = input.required<Slide & { kind: 'total' }>();

  protected registered = computed(() => formatCount(this.slide().registered));
  protected withCompany = computed(() => formatCount(this.slide().withCompany));
}
