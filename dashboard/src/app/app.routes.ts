import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { DivisionDetailsComponent } from './pages/divisions/division-details/division-details.component';
import { StopgroupDetailsComponent } from './pages/stop-groups/stop-group-details/stop-group-details.component';
import { StopDetailsComponent } from './pages/stops/stop-details/stop-details.component';
import { StudentComponent } from './pages/students/student-details/student-details.component';
import { StopManagerDetailsComponent } from './pages/stop-managers/stop-manager-details/stop-manager-details.component';
import { FeedbackConfiguratorComponent } from './pages/feedback/configurator/configurator.component';
import { DataManagementComponent } from './pages/dashboard/data-management.component';
import { OverviewComponent } from './pages/overview/overview.component';
import { BuffetComponent } from './pages/buffet/buffet.component';
import { StudentsAndStopsComponent } from './pages/students-and-stops/students-and-stops.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { adminOrStopManagerGuard } from './core/guards/admin-or-stop-manager.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'overview',
    component: OverviewComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    // Students, Stop Groups and Stops are tabs of one page; Students has no ?tab.
    path: 'students-and-stops',
    component: StudentsAndStopsComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'students',
    // Keeps ?status= from the overview's bookmarks.
    redirectTo: ({ queryParams }) =>
      inject(Router).createUrlTree(['/students-and-stops'], { queryParams }),
  },
  {
    path: 'stopgroups',
    redirectTo: () =>
      inject(Router).parseUrl('/students-and-stops?tab=stopgroups'),
  },
  {
    path: 'stops',
    redirectTo: () => inject(Router).parseUrl('/students-and-stops?tab=stops'),
  },
  {
    // Divisions are a tab of Users & Data now.
    path: 'divisions',
    redirectTo: () => inject(Router).parseUrl('/data-management?tab=divisions'),
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
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'stop',
    component: StopDetailsComponent,
    canMatch: [authGuard],
    canActivate: [adminOrStopManagerGuard],
    canDeactivate: [unsavedChangesGuard],
  },
  { path: 'student', component: StudentComponent, canMatch: [authGuard] },
  {
    path: 'stop-manager',
    component: StopManagerDetailsComponent,
    canMatch: [authGuard],
    canActivate: [adminOrStopManagerGuard],
  },
  {
    path: 'data-management',
    component: DataManagementComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'feedback',
    component: FeedbackConfiguratorComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'registration',
    // Lazy, so the initial bundle stays within its budget.
    loadComponent: () =>
      import('./pages/registration/registration.component').then(
        (m) => m.RegistrationComponent
      ),
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  {
    path: 'buffet',
    component: BuffetComponent,
    canMatch: [authGuard],
    canActivate: [adminGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
