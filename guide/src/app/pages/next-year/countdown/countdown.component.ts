import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { CountdownUnitComponent } from '@pages/next-year/countdown-unit/countdown-unit.component';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

@Component({
  selector: 'app-countdown',
  imports: [CountdownUnitComponent],
  templateUrl: './countdown.component.html',
  styleUrl: './countdown.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent implements OnInit, OnDestroy {
  targetDate = input.required<Date>();

  timeLeft: WritableSignal<TimeLeft> = signal({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  isComplete = false;
  private subscription?: Subscription;

  ngOnInit(): void {
    // Calculate on first render
    this.calculateTimeLeft();

    // Update every second
    this.subscription = interval(1000).subscribe(() => {
      this.calculateTimeLeft();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private calculateTimeLeft(): void {
    const difference = this.targetDate().getTime() - new Date().getTime();

    if (difference <= 0) {
      this.isComplete = true;
      this.timeLeft.set({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      });
      return;
    }

    this.timeLeft.set({
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    });
  }
}
