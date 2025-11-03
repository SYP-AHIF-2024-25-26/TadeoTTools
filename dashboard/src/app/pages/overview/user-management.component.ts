import { Component, inject, signal } from '@angular/core';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { DataPageComponent } from './data-page/data-page.component';
import { TeacherOverviewComponent } from './teacher-overview/teacher-overview.component';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import { StudentService } from '../../student.service';

@Component({
  selector: 'app-overview',
  imports: [AdminOverviewComponent, DataPageComponent, TeacherOverviewComponent, DeletePopupComponent],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent {
  private studentService = inject(StudentService);
  showDeleteStudentsPopup = signal<boolean>(false);

  async deleteAllStudents() {
    await this.studentService.deleteAllStudents();
  }
}
