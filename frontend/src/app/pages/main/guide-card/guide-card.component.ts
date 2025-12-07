import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  model,
  Output,
  ViewChild,
} from '@angular/core';
import { CheckboxComponent } from '@pages/main/checkbox/checkbox.component';
import { CommonModule } from '@angular/common';
import { StopGroup } from '@shared/models/types';
import { Router } from '@angular/router';

@Component({
  selector: 'app-guide-card',
  imports: [CheckboxComponent, CommonModule],
  templateUrl: './guide-card.component.html',
  styleUrl: './guide-card.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideCardComponent {
  stopGroup = input.required<StopGroup>();
  checked = model<boolean>(false);
  progress = input<number>(0);
  totalStops = input<number>(0);
  @Output() openStopPage = new EventEmitter<void>();
  @Output() onToggle = new EventEmitter<void>();
  
  protected router = inject(Router);
}
