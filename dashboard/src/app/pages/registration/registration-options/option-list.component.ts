import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { RegistrationService } from '@/core/services/registration.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { CsvImportComponent } from '@/shared/components/csv-import/csv-import.component';
import { RegistrationOptionKind } from '@/shared/models/types';
import { downloadFile } from '@/shared/utils/utils';

// One choice list of the kiosk, edited as a whole: reorder, add, remove, then one Save.
@Component({
  selector: 'app-option-list',
  templateUrl: './option-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DragDropModule, CsvImportComponent],
})
export class OptionListComponent {
  private registrationService = inject(RegistrationService);
  private toast = inject(ToastService);

  kind = input.required<RegistrationOptionKind>();
  heading = input.required<string>();
  // Singular noun for messages, e.g. "reason".
  noun = input.required<string>();
  placeholder = input('');
  names = input.required<string[]>();
  changed = output<void>();

  // The list as edited; saved as a whole.
  protected items = signal<string[]>([]);
  protected saving = signal(false);
  protected saveError = signal('');
  protected downloading = signal(false);

  // A form group, so the <form> gets ngSubmit; a plain form would submit natively and reload the page.
  protected addForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });
  protected addError = signal('');

  protected dirty = computed(() => !sameList(this.names(), this.items()));

  protected readonly upload = (file: File) =>
    this.registrationService.importCsv(this.csvPath(), file);

  constructor() {
    // A reload from the server takes the new list, but keeps edits that are not saved yet.
    effect(() => {
      const names = this.names();
      untracked(() => {
        if (!this.loaded || sameList(this.loaded, this.items())) {
          this.items.set([...names]);
        }
        this.loaded = names;
      });
    });
  }

  private loaded: string[] | undefined;

  private csvPath(): string {
    return `/api/registration-options/${this.kind()}/csv`;
  }

  protected drop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  // Keyboard alternative to dragging.
  protected move(from: number, to: number): void {
    this.items.update((items) => {
      const next = [...items];
      moveItemInArray(next, from, to);
      return next;
    });
  }

  protected remove(index: number): void {
    this.items.update((items) => items.filter((_, i) => i !== index));
  }

  protected add(): void {
    const name = this.addForm.controls.name.value.trim();
    if (!name || this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    if (this.items().some((n) => n.toLowerCase() === name.toLowerCase())) {
      this.addError.set(`"${name}" is already in the list.`);
      return;
    }
    this.addError.set('');
    this.items.update((items) => [...items, name]);
    this.addForm.reset();
  }

  protected discard(): void {
    this.items.set([...this.names()]);
    this.saveError.set('');
  }

  protected async save(): Promise<void> {
    if (this.saving() || !this.dirty()) return;
    if (this.items().length === 0) {
      this.saveError.set(
        `The kiosk asks for one ${this.noun()}, so the list needs at least one entry.`
      );
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    try {
      await this.registrationService.updateOptions(this.kind(), this.items());
      this.loaded = this.items();
      this.toast.success(`${this.heading()} saved.`);
      this.changed.emit();
    } catch (error) {
      this.saveError.set(errorText(error, 'The list could not be saved.'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async downloadCsv(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);
    try {
      downloadFile(
        await this.registrationService.getCsvFile(this.csvPath()),
        `${this.kind()}.csv`
      );
    } catch (error) {
      this.toast.error(errorText(error, 'The list could not be downloaded.'));
    } finally {
      this.downloading.set(false);
    }
  }
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((name, i) => name === b[i]);
}
