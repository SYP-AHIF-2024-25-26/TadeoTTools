import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import {StopgroupsComponent} from "./stopgroups/stopgroups.component";
import { DivisionsListComponent } from './divisions-list/divisions-list.component';
import { DivisionDetailsComponent } from './division-details/division-details.component';
import {TestComponent} from "./test/test.component";

export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'test', component: TestComponent},
  {path: 'stopgroups', component: StopgroupsComponent},
  {path: 'divisions', component: DivisionsListComponent},
  {path: 'division', component: DivisionDetailsComponent},
  {path: '', redirectTo: 'login', pathMatch: 'full'},
];


