import { Component, inject, signal } from '@angular/core';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { DataPageComponent } from './data-page/data-page.component';
import { TeacherOverviewComponent } from './teacher-overview/teacher-overview.component';
import { StudentStore } from '../../store/student.store';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';

@Component({
  selector: 'app-overview',
  imports: [AdminOverviewComponent, DataPageComponent, TeacherOverviewComponent, DeletePopupComponent],
  templateUrl: './admin.component.html',
})
export class AdminComponent {
  private studentStore = inject(StudentStore);
  showDeleteStudentsPopup = signal<boolean>(false);

  async deleteAllStudents() {
    await this.studentStore.deleteAllStudents();
  }
}
