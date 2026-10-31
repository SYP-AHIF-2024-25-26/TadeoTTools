import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { GUIDE_URL } from '@/app.config';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';

// The real, deployed guide in a phone-sized frame; ?preview lifts the countdown there.
@Component({
  selector: 'app-preview',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-shell">
      <app-page-header
        title="Preview"
        subtitle="The visitor guide as it will look. Progress and feedback are not saved."
      />
      <iframe
        title="Visitor guide preview"
        class="mx-auto block h-[800px] max-h-[calc(100dvh-12rem)] w-full max-w-[390px] rounded-lg border border-base-300"
        [src]="guideSrc"
      ></iframe>
    </div>
  `,
})
export class PreviewComponent {
  private readonly sanitizer = inject(DomSanitizer);

  // Comes from the app's configuration, never from user input.
  protected readonly guideSrc = this.sanitizer.bypassSecurityTrustResourceUrl(
    `${inject(GUIDE_URL).replace(/\/$/, '')}/?preview`
  );
}
