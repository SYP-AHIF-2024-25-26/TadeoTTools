import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { StopGroupsComponent } from './stopgroups/stopgroups.component';
import { DivisionsListComponent } from './divisions-list/divisions-list.component';
import { DivisionDetailsComponent } from './division-details/division-details.component';
import {TestComponent} from "./test/test.component";
import {SecondTestComponent} from "./second-test/second-test.component";

export const routes: Routes = [
  { path: 'test', component: TestComponent },
  { path: 'second', component: SecondTestComponent },
  { path: 'login', component: LoginComponent },
  { path: 'stopgroups', component: StopGroupsComponent },
  { path: 'divisions', component: DivisionsListComponent },
  { path: 'division', component: DivisionDetailsComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
