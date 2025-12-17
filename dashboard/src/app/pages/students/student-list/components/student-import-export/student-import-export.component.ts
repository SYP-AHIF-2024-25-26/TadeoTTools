import { Component, inject, output, signal } from '@angular/core';
import { StudentService } from '@/core/services/student.service';
import { downloadFile } from '@/shared/utils/utils';

@Component({
  selector: 'app-student-import-export',
  standalone: true,
  templateUrl: './student-import-export.component.html',
})
export class StudentImportExportComponent {
  private studentService = inject(StudentService);

  readonly exportFiltered = output<void>();

  selectedStudentFile = signal<File | null>(null);

  onStudentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentFile.set(input.files[0]);
    }
  }

  async submitStudentsCsv(): Promise<void> {
    if (!this.selectedStudentFile()) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      await this.studentService.uploadStudentsCsv(
        this.selectedStudentFile() as File
      );
      location.reload();
    } catch (error) {
      console.error('Error uploading CSV:', error);
    }
  }

  async downloadStudentsData() {
    try {
      const blob = await this.studentService.getStudentsDataFile();
      downloadFile(blob, 'students_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download students data');
    }
  }
}
