import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { errorText } from '@/core/services/toast.service';
import { ImportResult } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';

let nextId = 0;

/**
 * One CSV import: file field, Import button, the expected column format and
 * the result of the last import. The page passes the upload call, so the
 * same block serves students, assignments and stop managers.
 */
@Component({
  selector: 'app-csv-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <label [for]="inputId" class="mb-1 block text-sm font-medium">{{
        label()
      }}</label>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          [id]="inputId"
          type="file"
          accept=".csv"
          class="file-input file-input-bordered file-input-sm w-full sm:max-w-md"
          (change)="onFileSelected($event)"
        />
        <button
          type="button"
          class="btn btn-primary btn-sm self-start sm:self-auto"
          [disabled]="!file() || importing()"
          (click)="runImport()"
        >
          @if (importing()) {
            <span class="loading loading-spinner loading-xs"></span>
            Importing…
          } @else {
            Import
          }
        </button>
      </div>
      <p class="mt-2 text-xs text-ink-muted">
        Columns:
        <code
          class="rounded bg-black/5 px-1 font-mono dark:bg-white/10"
          >{{ format() }}</code
        >
        @if (hint()) {
          <br />{{ hint() }}
        }
      </p>
      @if (result(); as r) {
        <div
          class="alert mt-3 whitespace-pre-line text-sm"
          [class.alert-success]="r.ok"
          [class.alert-error]="!r.ok"
          [attr.role]="r.ok ? 'status' : 'alert'"
        >
          {{ r.message }}
        </div>
      }
    </div>
  `,
})
export class CsvImportComponent {
  label = input.required<string>();
  // The expected header, e.g. "EdufsUsername;FirstName;LastName".
  format = input.required<string>();
  hint = input<string>('');
  // Singular noun for the result message, e.g. "student".
  noun = input.required<string>();
  upload = input.required<(file: File) => Promise<ImportResult>>();

  imported = output<void>();

  readonly inputId = `csv-import-${nextId++}`;
  file = signal<File | null>(null);
  importing = signal(false);
  result = signal<{ ok: boolean; message: string } | null>(null);

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.file.set(files && files.length > 0 ? files[0] : null);
  }

  async runImport(): Promise<void> {
    const file = this.file();
    if (!file || this.importing()) return;
    this.importing.set(true);
    this.result.set(null);
    try {
      const result = await this.upload()(file);
      let message = `Imported ${plural(result.added, this.noun())}.`;
      if (result.skipped > 0) {
        message += ` ${plural(result.skipped, 'row')} skipped because ${
          result.skipped === 1 ? 'it' : 'they'
        } already existed.`;
      }
      this.result.set({ ok: true, message });
      this.imported.emit();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      this.result.set({
        ok: false,
        message: errorText(
          error,
          'The import failed. Check that the file matches the columns shown below.'
        ),
      });
    } finally {
      this.importing.set(false);
    }
  }
}
