import { Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { DataPageComponent } from './data-page/data-page.component';
import { StopManagerOverviewComponent } from './stop-manager-overview/stop-manager-overview.component';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';

type TabType = 'stop-managers' | 'admins' | 'data';

@Component({
  selector: 'app-overview',
  imports: [
    AdminOverviewComponent,
    DataPageComponent,
    StopManagerOverviewComponent,
    RouterLink,
    PageHeaderComponent,
  ],
  templateUrl: './data-management.component.html',
})
export class DataManagementComponent implements OnInit {
  private scrollService = inject(ScrollPersistenceService);
  private route = inject(ActivatedRoute);

  private queryParams = toSignal(this.route.queryParamMap);
  readonly activeTab = computed<TabType>(() => {
    const tab = this.queryParams()?.get('tab');
    return tab === 'admins' || tab === 'data' ? tab : 'stop-managers';
  });

  ngOnInit() {
    this.scrollService.restoreScroll();
  }
}
