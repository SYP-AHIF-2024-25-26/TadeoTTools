import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { StopGroupsComponent } from './stopgroups/stopgroups.component';
import { DivisionsListComponent } from './divisions-list/divisions-list.component';
import { DivisionDetailsComponent } from './division-details/division-details.component';
import { StopgroupDetailsComponent } from './stopgroup-details/stopgroup-details.component';
import { StopDetailsComponent } from './stop-details/stop-details.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'stopgroups', component: StopGroupsComponent },
  { path: 'divisions', component: DivisionsListComponent },
  { path: 'division', component: DivisionDetailsComponent },
  { path: 'stopgroup', component: StopgroupDetailsComponent},
  { path: 'stop', component: StopDetailsComponent},
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
