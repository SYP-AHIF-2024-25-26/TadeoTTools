import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { Info } from '@/shared/models/types';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoPopupComponent implements OnInit, OnDestroy {
  info = input<Info>();
  deleted = output<number>();

  private timer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit() {
    // Errors stay until dismissed so they can't be missed; toasts with an
    // action (e.g. Undo) stay a little longer.
    const info = this.info();
    if (info?.type !== 'error') {
      this.timer = setTimeout(
        () => this.closePopup(),
        info?.action ? 8000 : 4000
      );
    }
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  runAction() {
    this.info()?.action?.run();
    this.closePopup();
  }

  closePopup() {
    const info = this.info();
    if (info) {
      this.deleted.emit(info.id);
    }
  }
}
