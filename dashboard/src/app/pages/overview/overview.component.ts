import { Component } from '@angular/core';
import { AdminOverviewComponent } from '../admin-overview/admin-overview.component';
import { DataPageComponent } from '../data-page/data-page.component';


@Component({
  selector: 'app-overview',
  imports: [AdminOverviewComponent, DataPageComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {

}
