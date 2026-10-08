import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { DataPageComponent } from './data-page/data-page.component';
import { StopManagerOverviewComponent } from './stop-manager-overview/stop-manager-overview.component';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { StudentService } from '@/core/services/student.service';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

type TabType = 'stop-managers' | 'admins' | 'data';

@Component({
  selector: 'app-overview',
  imports: [
    AdminOverviewComponent,
    DataPageComponent,
    StopManagerOverviewComponent,
  ],
  templateUrl: './data-management.component.html',
})
export class DataManagementComponent implements OnInit {
  private studentService = inject(StudentService);
  private scrollService = inject(ScrollPersistenceService);
  private route = inject(ActivatedRoute);

  activeTab = signal<TabType>('stop-managers');

  ngOnInit() {
    // The overview's shortcuts open a tab directly, e.g. ?tab=data.
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'stop-managers' || tab === 'admins' || tab === 'data') {
      this.activeTab.set(tab);
    }
    this.scrollService.restoreScroll();
  }
}
