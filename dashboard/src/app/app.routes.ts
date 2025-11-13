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
import { UserManagementComponent } from './pages/overview/user-management.component';
import { authGuard } from './auth.guard';
import { adminGuard } from './guards/admin.guard';
import { adminOrTeacherGuard } from './guards/admin-or-teacher.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'stopgroups', component: StopGroupsComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'stops', component: StopsComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'divisions', component: DivisionsListComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'division', component: DivisionDetailsComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'stopgroup', component: StopgroupDetailsComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'stop', component: StopDetailsComponent, canMatch: [authGuard], canActivate: [adminOrTeacherGuard] },
  { path: 'student', component: StudentComponent, canMatch: [authGuard] },
  { path: 'teacher', component: TeacherComponent, canMatch: [authGuard], canActivate: [adminOrTeacherGuard] },
  { path: 'user-management', component: UserManagementComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'students', component: ListStudentsComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: 'feedback', component: FeedbackConfiguratorComponent, canMatch: [authGuard], canActivate: [adminGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
