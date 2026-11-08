import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ProgressService } from '@core/services/progress.service';
import { SwipeNavigatorService } from '@core/services/swipe-navigator.service';

@Component({
  selector: 'app-about-page',
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(swiperight)': 'onSwipeRight()', '(swipeleft)': 'onSwipeLeft()' },
})
export class AboutPageComponent {
  private swipe = inject(SwipeNavigatorService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
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
    void this.swipe.go(['/feedback'], 'right');
  }

  /** The last tab: nothing further to the right. */
  onSwipeLeft() {
    this.swipe.bounce(this.host.nativeElement, 'left');
  }
}
