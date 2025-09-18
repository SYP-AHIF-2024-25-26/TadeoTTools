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
import { ListStudentsComponent } from './pages/list-students/list-students.component';
import { FeedbackConfiguratorComponent } from './pages/feedback-configurator/feedback-configurator.component';
import { AdminComponent } from './pages/overview/admin.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'stopgroups', component: StopGroupsComponent, canMatch: [authGuard] },
  { path: 'stops', component: StopsComponent, canMatch: [authGuard] },
  { path: 'divisions', component: DivisionsListComponent, canMatch: [authGuard] },
  { path: 'division', component: DivisionDetailsComponent, canMatch: [authGuard] },
  { path: 'stopgroup', component: StopgroupDetailsComponent, canMatch: [authGuard] },
  { path: 'stop', component: StopDetailsComponent, canMatch: [authGuard] },
  { path: 'student', component: StudentComponent, canMatch: [authGuard] },
  { path: 'teacher', component: TeacherComponent, canMatch: [authGuard] },
  { path: 'admin', component: AdminComponent, canMatch: [authGuard] },
  { path: 'students', component: ListStudentsComponent, canMatch: [authGuard] },
  { path: 'feedback', component: FeedbackConfiguratorComponent, canMatch: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
