import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    <div class="flex flex-col items-center gap-4">
      <div
        class="loader h-12 w-12 rounded-full border-8 border-t-8 border-primary-200 ease-linear"
      ></div>
      @if (text) {
        <p class="text-text-600">{{ text }}</p>
      }
    </div>
  `,
})
export class LoaderComponent {
  @Input() text: string = '';
}
