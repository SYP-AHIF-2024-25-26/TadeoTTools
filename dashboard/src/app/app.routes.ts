import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { StopGroupsComponent } from './pages/stopgroups/stopgroups.component';
import { DivisionsListComponent } from './pages/divisions-list/divisions-list.component';
import { DivisionDetailsComponent } from './detail-pages/division-details/division-details.component';
import { StopgroupDetailsComponent } from './detail-pages/stopgroup-details/stopgroup-details.component';
import { StopDetailsComponent } from './detail-pages/stop-details/stop-details.component';
import { StopsComponent } from './pages/stops/stops.component';
import { StudentComponent } from './pages/student/student.component';
import { TeacherComponent } from './pages/teacher/teacher.component';
import { AdminOverviewComponent } from './pages/admin-overview/admin-overview.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'stopgroups', component: StopGroupsComponent },
  { path: 'stops', component: StopsComponent },
  { path: 'divisions', component: DivisionsListComponent },
  { path: 'division', component: DivisionDetailsComponent },
  { path: 'stopgroup', component: StopgroupDetailsComponent },
  { path: 'stop', component: StopDetailsComponent },
  { path: 'student', component: StudentComponent },
  { path: 'teacher', component: TeacherComponent },
  { path: 'overview', component: AdminOverviewComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
