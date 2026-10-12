import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CheckboxComponent } from '@pages/main/checkbox/checkbox.component';
import { StopGroup } from '@shared/models/types';
import {
  TourBandComponent,
  TourSegment,
} from '@shared/components/tour-band/tour-band.component';

@Component({
  selector: 'app-guide-card',
  imports: [CheckboxComponent, TourBandComponent],
  templateUrl: './guide-card.component.html',
  styleUrl: './guide-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuideCardComponent {
  stopGroup = input.required<StopGroup>();
  checked = input<boolean>(false);
  progress = input<number>(0);
  totalStops = input<number>(0);
  segments = input<TourSegment[]>([]);
  open = output<void>();
  toggled = output<void>();
}
