import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { StopGroupsComponent } from './pages/stop-groups/stop-group-list/stop-group-list.component';
import { DivisionsListComponent } from './pages/divisions/division-list/division-list.component';
import { DivisionDetailsComponent } from './pages/divisions/division-details/division-details.component';
import { StopgroupDetailsComponent } from './pages/stop-groups/stop-group-details/stop-group-details.component';
import { StopDetailsComponent } from './pages/stops/stop-details/stop-details.component';
import { StopsComponent } from './pages/stops/stop-list/stop-list.component';
import { StudentComponent } from './pages/students/student-details/student-details.component';
import { StopManagerDetailsComponent } from './pages/stop-managers/stop-manager-details/stop-manager-details.component';
import { ListStudentsComponent } from './pages/students/student-list/student-list.component';
import { FeedbackConfiguratorComponent } from './pages/feedback/configurator/configurator.component';
import { UserManagementComponent } from './pages/dashboard/user-management.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { adminOrStopManagerGuard } from './core/guards/admin-or-stop-manager.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'stopgroups',
    component: StopGroupsComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'stops',
    component: StopsComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'divisions',
    component: DivisionsListComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'division',
    component: DivisionDetailsComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'stopgroup',
    component: StopgroupDetailsComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'stop',
    component: StopDetailsComponent,
    canMatch: [authGuard],
    canActivate: [adminOrStopManagerGuard],
  },
  { path: 'student', component: StudentComponent, canMatch: [authGuard] },
  {
    path: 'stop-manager',
    component: StopManagerDetailsComponent,
    canMatch: [authGuard],
    canActivate: [adminOrStopManagerGuard],
  },
  {
    path: 'user-management',
    component: UserManagementComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'students',
    component: ListStudentsComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'feedback',
    component: FeedbackConfiguratorComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
