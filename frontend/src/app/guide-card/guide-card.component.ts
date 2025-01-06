import { Component, EventEmitter, inject, Input, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { CommonModule } from '@angular/common';
import { StopGroup } from '../types';
import { Router } from '@angular/router';
import { GUIDE_CARD_PREFIX, MANUAL_CHECK_PREFIX, STOP_GROUP_PROGRESS_PREFIX, STOPS_COUNT_PREFIX } from '../constants';

@Component({
  selector: 'app-guide-card',
  standalone: true,
  imports: [CheckboxComponent, CommonModule],
  templateUrl: './guide-card.component.html',
  styleUrl: './guide-card.component.css',
})
export class GuideCardComponent {
  @Input() stopGroup!: StopGroup;
  @Input() id!: string;
  @ViewChild(CheckboxComponent) checkbox!: CheckboxComponent;
  @Output() openStopPage = new EventEmitter<void>();
  protected router = inject(Router);
  progress: WritableSignal<number | null> = signal(null);
  stopsCount: WritableSignal<number | null> = signal(null);

  ngAfterViewInit() {
    this.initializeProgressAndCount();
    this.checkManualCheck();
  }

  isChecked(): boolean {
    return this.checkbox?.isChecked() ?? false;
  }

  private initializeProgressAndCount() {
    this.progress.set(this.getProgress());
    this.stopsCount.set(this.getStopsCount());
  }

  private checkManualCheck() {
    const manualCheck = sessionStorage.getItem(MANUAL_CHECK_PREFIX + this.id);
    if (manualCheck !== null) {
      this.checkbox.isChecked.set(manualCheck === 'true');
    }
    this.updateSessionStorage();
  }

  private updateSessionStorage() {
    if (this.progress() !== null && this.stopsCount() !== null) {
      if (this.progress() === this.stopsCount()) {
        sessionStorage.setItem(GUIDE_CARD_PREFIX + this.id, 'true');
        sessionStorage.removeItem(MANUAL_CHECK_PREFIX + this.id);
      } else if (sessionStorage.getItem(MANUAL_CHECK_PREFIX + this.id) !== 'true') {
        sessionStorage.setItem(GUIDE_CARD_PREFIX + this.id, 'false');
      }
    }
  }

  private getProgress(): number | null {
    const progress = sessionStorage.getItem(STOP_GROUP_PROGRESS_PREFIX + this.stopGroup.id);
    return progress !== null ? Number(progress) : null;
  }

  private getStopsCount(): number | null {
    const count = sessionStorage.getItem(STOPS_COUNT_PREFIX + this.stopGroup.id);
    return count !== null ? Number(count) : null;
  }
}
