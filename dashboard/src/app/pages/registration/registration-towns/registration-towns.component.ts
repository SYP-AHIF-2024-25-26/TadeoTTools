import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RegistrationService } from '@/core/services/registration.service';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { ActionIconComponent } from '@/shared/components/action-icon/action-icon.component';
import { CsvImportComponent } from '@/shared/components/csv-import/csv-import.component';
import { City, District, SaveCityRequest } from '@/shared/models/types';
import { downloadFile, plural } from '@/shared/utils/utils';
import { SortHeaderComponent } from '@/shared/components/sort-header/sort-header.component';
import { ariaSort, nextSort, sortBy, SortState } from '@/shared/utils/sort';

type TownSortKey = 'zipCode' | 'name' | 'number' | 'district' | 'visitorCount';

const CITIES_CSV = '/api/cities/csv';
// About 2,100 towns: the table shows this many at a time.
const PAGE_SIZE = 100;

function townForm() {
  return new FormGroup({
    zipCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[1-9]\d{3}$/)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(300)],
    }),
    number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[1-9]\d{4}$/)],
    }),
    districtId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
  });
}

type TownForm = ReturnType<typeof townForm>;

// Towns are searched by postcode or name, as at the kiosk; umlauts and case don't matter.
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

@Component({
  selector: 'app-registration-towns',
  templateUrl: './registration-towns.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ActionIconComponent,
    CsvImportComponent,
    SortHeaderComponent,
  ],
})
export class RegistrationTownsComponent {
  private registrationService = inject(RegistrationService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  cities = input.required<City[]>();
  districts = input.required<District[]>();
  changed = output<void>();

  protected search = signal('');
  protected districtFilter = signal<number | null>(null);
  protected limit = signal(PAGE_SIZE);

  private districtMap = computed(
    () => new Map(this.districts().map((d) => [d.id, d]))
  );

  protected filtered = computed(() => {
    const words = normalize(this.search().trim()).split(/\s+/).filter(Boolean);
    const district = this.districtFilter();
    return this.cities().filter(
      (c) =>
        (district === null || c.districtId === district) &&
        words.every((w) => normalize(`${c.zipCode} ${c.name}`).includes(w))
    );
  });

  protected sort = signal<SortState<TownSortKey>>({
    key: 'zipCode',
    direction: 'asc',
  });
  protected readonly ariaSort = ariaSort;

  // Sorted before the page is cut, so "Show more" continues in the same order.
  private sorted = computed(() =>
    sortBy(this.filtered(), this.sort(), (c, key) =>
      key === 'district' ? this.districtLabel(c.districtId) : c[key]
    )
  );

  protected shown = computed(() => this.sorted().slice(0, this.limit()));
  protected nextPage = computed(() =>
    Math.min(PAGE_SIZE, this.filtered().length - this.shown().length)
  );

  protected readonly plural = plural;

  protected addForm = townForm();
  protected adding = signal(false);
  protected addError = signal('');

  protected editingId = signal<number | null>(null);
  protected editForm = townForm();
  protected saving = signal(false);
  protected editError = signal('');

  protected downloading = signal(false);

  protected readonly upload = (file: File) =>
    this.registrationService.importCsv(CITIES_CSV, file);

  protected districtLabel(id: number): string {
    const d = this.districtMap().get(id);
    return d ? `${d.name} (${d.number})` : '';
  }

  protected setSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.limit.set(PAGE_SIZE);
  }

  protected setDistrict(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.districtFilter.set(value === '' ? null : Number(value));
    this.limit.set(PAGE_SIZE);
  }

  protected direction(key: TownSortKey) {
    return this.sort().key === key ? this.sort().direction : null;
  }

  protected sortOn(key: TownSortKey): void {
    this.sort.update((s) =>
      nextSort(s, key, key === 'visitorCount' ? 'desc' : 'asc')
    );
    this.limit.set(PAGE_SIZE);
  }

  protected showMore(): void {
    this.limit.update((n) => n + PAGE_SIZE);
  }

  protected edit(city: City): void {
    this.editForm.setValue({
      zipCode: city.zipCode,
      name: city.name,
      number: String(city.number),
      districtId: city.districtId,
    });
    this.editError.set('');
    this.editingId.set(city.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async add(): Promise<void> {
    if (this.addForm.invalid || this.adding()) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.adding.set(true);
    this.addError.set('');
    try {
      const city = await this.registrationService.addCity(
        request(this.addForm)
      );
      // Keeps the district, which is often the same for the next town.
      this.addForm.reset({ districtId: city.districtId });
      this.toast.success(`${city.zipCode} ${city.name} added.`);
      this.changed.emit();
    } catch (error) {
      this.addError.set(errorText(error, 'The town could not be added.'));
    } finally {
      this.adding.set(false);
    }
  }

  protected async save(city: City): Promise<void> {
    if (this.editForm.invalid || this.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.editError.set('');
    try {
      await this.registrationService.updateCity(
        city.id,
        request(this.editForm)
      );
      this.editingId.set(null);
      this.changed.emit();
    } catch (error) {
      this.editError.set(errorText(error, 'The town could not be saved.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(city: City): Promise<void> {
    // The backend refuses this too; saying why up front spares a dialog that cannot succeed.
    if (city.visitorCount > 0) {
      this.toast.error(
        `${plural(city.visitorCount, 'registration')} ${city.visitorCount === 1 ? 'comes' : 'come'} from ${city.name}. Rename the town instead of deleting it.`
      );
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Town',
      message: `${city.zipCode} ${city.name} is deleted and can no longer be chosen at the kiosk.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.registrationService.deleteCity(city.id);
      this.changed.emit();
    } catch (error) {
      this.toast.error(errorText(error, `${city.name} could not be deleted.`));
    }
  }

  protected async downloadCsv(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);
    try {
      downloadFile(
        await this.registrationService.getCsvFile(CITIES_CSV),
        'cities.csv'
      );
    } catch (error) {
      this.toast.error(errorText(error, 'The towns could not be downloaded.'));
    } finally {
      this.downloading.set(false);
    }
  }
}

function request(form: TownForm): SaveCityRequest {
  const { zipCode, name, number, districtId } = form.getRawValue();
  return {
    zipCode: zipCode.trim(),
    name: name.trim(),
    number: Number(number),
    districtId: districtId!,
  };
}
