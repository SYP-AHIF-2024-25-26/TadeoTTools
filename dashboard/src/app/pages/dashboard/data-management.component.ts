import { Component, computed, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminOverviewComponent } from './admin-overview/admin-overview.component';
import { StudentsDataComponent } from './students-data/students-data.component';
import { VisitorAppSettingsComponent } from './visitor-app-settings/visitor-app-settings.component';
import { DivisionsListComponent } from '@/pages/divisions/division-list/division-list.component';
import { StopManagerOverviewComponent } from './stop-manager-overview/stop-manager-overview.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';

const TABS = [
  'stop-managers',
  'admins',
  'students',
  'divisions',
  'visitor-app',
] as const;
type TabType = (typeof TABS)[number];

@Component({
  selector: 'app-overview',
  imports: [
    AdminOverviewComponent,
    StudentsDataComponent,
    DivisionsListComponent,
    VisitorAppSettingsComponent,
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
    // ?tab=data was the old Import & Export tab; its student files live in Students now.
    if (tab === 'data') return 'students';
    return TABS.find((t) => t === tab) ?? 'stop-managers';
  });

  ngOnInit() {
    this.scrollService.restoreScroll();
  }
}
