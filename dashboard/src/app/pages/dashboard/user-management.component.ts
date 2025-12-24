import { Component, inject, signal } from '@angular/core';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { DataPageComponent } from './data-page/data-page.component';
import { StopManagerOverviewComponent } from './stop-manager-overview/stop-manager-overview.component';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { StudentService } from '@/core/services/student.service';

type TabType = 'stop-managers' | 'admins' | 'data';

@Component({
  selector: 'app-overview',
  imports: [
    AdminOverviewComponent,
    DataPageComponent,
    StopManagerOverviewComponent,
  ],
  templateUrl: './user-management.component.html',
})
export class UserManagementComponent {
  private studentService = inject(StudentService);

  activeTab = signal<TabType>('stop-managers');
}
