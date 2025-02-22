import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';


type TimeBox = {
  label: string;
  value: string;
}

@Component({
  selector: 'app-next-year-page',
  imports: [
    HeaderComponent,
  ],
  templateUrl: './next-year-page.component.html',
  styleUrl: './next-year-page.component.css'
})
export class NextYearPageComponent {

}
