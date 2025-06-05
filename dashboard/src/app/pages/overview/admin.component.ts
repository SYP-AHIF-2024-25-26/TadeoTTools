import { Component } from '@angular/core';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { DataPageComponent } from './data-page/data-page.component';
import { TeacherOverviewComponent } from './teacher-overview/teacher-overview.component';


@Component({
  selector: 'app-overview',
  imports: [AdminOverviewComponent, DataPageComponent, TeacherOverviewComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent {

}
