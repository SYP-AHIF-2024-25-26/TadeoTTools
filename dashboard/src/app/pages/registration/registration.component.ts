import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { RegistrationService } from '@/core/services/registration.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';
import {
  City,
  District,
  RegistrationOptions,
  VisitorSummary,
} from '@/shared/models/types';
import { RegistrationVisitorsComponent } from './registration-visitors/registration-visitors.component';
import { RegistrationTownsComponent } from './registration-towns/registration-towns.component';
import { RegistrationDistrictsComponent } from './registration-districts/registration-districts.component';
import { RegistrationOptionsComponent } from './registration-options/registration-options.component';

export type RegistrationTab = 'visitors' | 'towns' | 'districts' | 'lists';
const TABS: RegistrationTab[] = ['visitors', 'towns', 'districts', 'lists'];

// The registration kiosk's data, one purpose per tab: the registrations and photos,
// the towns behind the postcode field, their districts, and the two choice lists.
// The tab is in the URL (`?tab=`), as on the Buffet page.
@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    RegistrationVisitorsComponent,
    RegistrationTownsComponent,
    RegistrationDistrictsComponent,
    RegistrationOptionsComponent,
  ],
})
export class RegistrationComponent {
  private registrationService = inject(RegistrationService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  private queryParams = toSignal(this.route.queryParamMap);
  protected readonly tab = computed<RegistrationTab>(() => {
    const tab = this.queryParams()?.get('tab') as RegistrationTab | null;
    return tab && TABS.includes(tab) ? tab : 'visitors';
  });
  protected readonly tabs: { id: RegistrationTab; label: string }[] = [
    { id: 'visitors', label: 'Registrations' },
    { id: 'towns', label: 'Towns' },
    { id: 'districts', label: 'Districts' },
    { id: 'lists', label: 'Choice Lists' },
  ];

  protected summary = signal<VisitorSummary | null>(null);
  protected districts = signal<District[]>([]);
  protected cities = signal<City[]>([]);
  protected options = signal<RegistrationOptions | null>(null);
  protected loading = signal(true);
  protected loadFailed = signal(false);

  private loaded = false;

  constructor() {
    // Fresh data whenever the tab changes (registrations arrive all day), including the first load.
    effect(() => {
      this.tab();
      untracked(() => {
        this.load(!this.loaded);
        this.loaded = true;
      });
    });
  }

  async load(first = false): Promise<void> {
    if (first) this.loading.set(true);
    try {
      const [summary, districts, cities, options] = await Promise.all([
        this.registrationService.getVisitorSummary(),
        this.registrationService.getDistricts(),
        this.registrationService.getCities(),
        this.registrationService.getOptions(),
      ]);
      this.summary.set(summary);
      this.districts.set(districts);
      this.cities.set(cities);
      this.options.set(options);
      this.loadFailed.set(false);
    } catch (error) {
      console.error('Failed to load the registration data', error);
      if (first) this.loadFailed.set(true);
      else
        this.toast.error(
          errorText(error, 'The registration data could not be reloaded.')
        );
    } finally {
      this.loading.set(false);
    }
  }
}
