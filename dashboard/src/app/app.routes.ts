import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { StopGroupsComponent } from './stopgroups/stopgroups.component';
import { DivisionsListComponent } from './divisions-list/divisions-list.component';
import { DivisionDetailsComponent } from './division-details/division-details.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'stopgroups', component: StopGroupsComponent },
  { path: 'divisions', component: DivisionsListComponent },
  { path: 'division', component: DivisionDetailsComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
