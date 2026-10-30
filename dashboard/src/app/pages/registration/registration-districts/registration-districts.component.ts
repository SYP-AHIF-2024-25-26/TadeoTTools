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
import { District, SaveDistrictRequest } from '@/shared/models/types';
import { downloadFile, plural } from '@/shared/utils/utils';
import { SortHeaderComponent } from '@/shared/components/sort-header/sort-header.component';
import { ariaSort, nextSort, sortBy, SortState } from '@/shared/utils/sort';

type DistrictSortKey = 'number' | 'name' | 'cityCount';

export const DISTRICTS_CSV = '/api/districts/csv';

function districtForm() {
  return new FormGroup({
    number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[1-9]\d{2}$/)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });
}

type DistrictForm = ReturnType<typeof districtForm>;

@Component({
  selector: 'app-registration-districts',
  templateUrl: './registration-districts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    ActionIconComponent,
    CsvImportComponent,
    SortHeaderComponent,
  ],
})
export class RegistrationDistrictsComponent {
  private registrationService = inject(RegistrationService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  districts = input.required<District[]>();
  changed = output<void>();

  protected sort = signal<SortState<DistrictSortKey>>({
    key: 'number',
    direction: 'asc',
  });
  protected sorted = computed(() =>
    sortBy(this.districts(), this.sort(), (d, key) => d[key])
  );
  protected readonly ariaSort = ariaSort;

  protected direction(key: DistrictSortKey) {
    return this.sort().key === key ? this.sort().direction : null;
  }

  protected sortOn(key: DistrictSortKey): void {
    this.sort.update((s) =>
      nextSort(s, key, key === 'cityCount' ? 'desc' : 'asc')
    );
  }

  protected addForm = districtForm();
  protected adding = signal(false);
  protected addError = signal('');

  protected editingId = signal<number | null>(null);
  protected editForm = districtForm();
  protected saving = signal(false);
  protected editError = signal('');

  protected downloading = signal(false);

  protected readonly upload = (file: File) =>
    this.registrationService.importCsv(DISTRICTS_CSV, file);

  protected edit(district: District): void {
    this.editForm.setValue({
      number: String(district.number),
      name: district.name,
    });
    this.editError.set('');
    this.editingId.set(district.id);
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
      await this.registrationService.addDistrict(request(this.addForm));
      this.addForm.reset();
      this.changed.emit();
    } catch (error) {
      this.addError.set(saveErrorText(error));
    } finally {
      this.adding.set(false);
    }
  }

  protected async save(district: District): Promise<void> {
    if (this.editForm.invalid || this.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.editError.set('');
    try {
      await this.registrationService.updateDistrict(
        district.id,
        request(this.editForm)
      );
      this.editingId.set(null);
      this.changed.emit();
    } catch (error) {
      this.editError.set(saveErrorText(error));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(district: District): Promise<void> {
    // The backend refuses this too; saying why up front spares a dialog that cannot succeed.
    if (district.cityCount > 0) {
      this.toast.error(
        `${plural(district.cityCount, 'town')} still ${district.cityCount === 1 ? 'belongs' : 'belong'} to ${district.name}. Move them to another district on the Towns tab first.`
      );
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete District',
      message: `${district.name} (${district.number}) is deleted. No town belongs to it.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.registrationService.deleteDistrict(district.id);
      this.changed.emit();
    } catch (error) {
      this.toast.error(
        errorText(error, `${district.name} could not be deleted.`)
      );
    }
  }

  protected async downloadCsv(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);
    try {
      downloadFile(
        await this.registrationService.getCsvFile(DISTRICTS_CSV),
        'districts.csv'
      );
    } catch (error) {
      this.toast.error(
        errorText(error, 'The districts could not be downloaded.')
      );
    } finally {
      this.downloading.set(false);
    }
  }
}

function request(form: DistrictForm): SaveDistrictRequest {
  const { number, name } = form.getRawValue();
  return { number: Number(number), name: name.trim() };
}

// A 409 from the backend names the number or name that is taken.
function saveErrorText(error: unknown): string {
  return errorText(error, 'The district could not be saved.');
}
