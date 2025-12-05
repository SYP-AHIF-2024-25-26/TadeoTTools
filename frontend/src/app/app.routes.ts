import { Routes } from '@angular/router';
import { MainPageComponent } from '@app/pages/main/main-page/main-page.component';
import { StopDescriptionPageComponent } from '@app/pages/main/stop-description-page/stop-description-page.component';
import { MapComponent } from '@app/pages/map/map.component';
import { StopPageComponent } from '@app/pages/main/stop-page/stop-page.component';
import { AboutPageComponent } from '@app/pages/about/about-page.component';
import { FeedbackComponent } from '@app/pages/feedback/feedback.component';

export const routes: Routes = [
  { path: '', component: MainPageComponent },
  { path: 'feedback', component: FeedbackComponent },
  { path: 'main', component: MainPageComponent },
  { path: 'tour/:stopGroupId', component: StopPageComponent },
  {
    path: 'tour/:stopGroupId/stop/:stopId',
    component: StopDescriptionPageComponent,
  },
  { path: 'map', component: MapComponent },
  { path: 'map/:roomNr', component: MapComponent },
  { path: 'about', component: AboutPageComponent },
  { path: '', redirectTo: '', pathMatch: 'full' },
];
