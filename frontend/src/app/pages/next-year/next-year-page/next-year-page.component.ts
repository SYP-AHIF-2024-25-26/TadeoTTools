import { Component } from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { CountdownComponent } from '@pages/next-year/countdown/countdown.component';

@Component({
  selector: 'app-next-year-page',
  imports: [HeaderComponent, CountdownComponent],
  templateUrl: './next-year-page.component.html',
  styleUrl: './next-year-page.component.css',
  standalone: true,
})
export class NextYearPageComponent {
  protected targetDate: Date = new Date(2025, 10, 21, 0, 0, 0, 0);
}
