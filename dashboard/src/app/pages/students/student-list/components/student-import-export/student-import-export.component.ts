import { Component, inject, output, signal } from '@angular/core';
import { StudentService } from '@/core/services/student.service';
import { downloadFile, plural } from '@/shared/utils/utils';
import { errorText, ToastService } from '@/core/services/toast.service';

@Component({
  selector: 'app-student-import-export',
  standalone: true,
  templateUrl: './student-import-export.component.html',
})
export class StudentImportExportComponent {
  private studentService = inject(StudentService);
  private toast = inject(ToastService);

  // Emitted after a successful import so the list can refresh.
  imported = output<void>();
  importing = signal<boolean>(false);
  result = signal<{ ok: boolean; message: string } | null>(null);

  selectedStudentFile = signal<File | null>(null);

  onStudentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentFile.set(input.files[0]);
    }
  }

  async submitStudentsCsv(): Promise<void> {
    const file = this.selectedStudentFile();
    if (!file || this.importing()) {
      return;
    }
    this.importing.set(true);
    this.result.set(null);
    try {
      const result = await this.studentService.uploadStudentsCsv(file);
      let message = `Imported ${plural(result.added, 'student')}.`;
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
          'The import failed. Check that the file matches the format shown below.'
        ),
      });
    } finally {
      this.importing.set(false);
    }
  }

  async downloadStudentsData() {
    try {
      const blob = await this.studentService.getStudentsDataFile();
      downloadFile(blob, 'students_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The students data could not be downloaded.')
      );
    }
  }
}
