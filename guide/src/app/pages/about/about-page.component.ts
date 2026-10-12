import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ProgressService } from '@core/services/progress.service';

@Component({
  selector: 'app-about-page',
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(swiperight)': 'onSwipeRight()' },
})
export class AboutPageComponent {
  private router = inject(Router);
  private progress = inject(ProgressService);

  /** The reset asks once in place before it deletes anything. */
  protected confirmingReset = signal(false);
  protected resetDone = signal(false);

  protected reset() {
    this.progress.reset();
    this.confirmingReset.set(false);
    this.resetDone.set(true);
  }

  onSwipeRight() {
    this.router.navigate(['/feedback']);
  }
}
