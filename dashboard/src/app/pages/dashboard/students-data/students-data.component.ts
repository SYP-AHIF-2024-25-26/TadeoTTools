import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { StudentService } from '@/core/services/student.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { CsvImportComponent } from '@/shared/components/csv-import/csv-import.component';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { ImportResult } from '@/shared/models/types';
import { downloadFile, plural } from '@/shared/utils/utils';

// Users & Data > Students: every file action for student data in one place.
@Component({
  selector: 'app-students-data',
  imports: [CsvImportComponent, DeletePopupComponent],
  templateUrl: './students-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsDataComponent {
  private studentService = inject(StudentService);
  private toast = inject(ToastService);

  readonly uploadStudents = (file: File): Promise<ImportResult> =>
    this.studentService.uploadStudentsCsv(file);
  readonly uploadAssignments = (file: File): Promise<ImportResult> =>
    this.studentService.uploadStudentAssignmentsCsv(file);

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

  showDeleteStudentsPopup = signal<boolean>(false);
  studentCount = signal<number | null>(null);
  deletingStudents = signal<boolean>(false);
  deleteStudentsResult = signal<{ ok: boolean; message: string } | null>(null);
  countingStudents = signal<boolean>(false);

  // The dialog only opens once the count is known, so the typed
  // confirmation always matches the real number of students.
  async openDeleteStudents() {
    if (this.countingStudents()) return;
    this.deleteStudentsResult.set(null);
    this.countingStudents.set(true);
    try {
      this.studentCount.set((await this.studentService.getStudents()).length);
      this.showDeleteStudentsPopup.set(true);
    } catch (error) {
      console.error('Failed to count students', error);
      this.deleteStudentsResult.set({
        ok: false,
        message: errorText(
          error,
          'The students could not be counted, so nothing was deleted. Please try again.'
        ),
      });
    } finally {
      this.countingStudents.set(false);
    }
  }

  deleteStudentsMessage(): string {
    return (
      `All ${plural(this.studentCount() ?? 0, 'student')} and their stop assignments will be permanently deleted. ` +
      'This cannot be undone.\nDownload the students data first if you may need it again.'
    );
  }

  // Typing the student count proves the admin read how many will go.
  deleteStudentsConfirmText(): string {
    return String(this.studentCount() ?? 0);
  }

  async deleteAllStudents() {
    this.deletingStudents.set(true);
    try {
      await this.studentService.deleteAllStudents();
      this.deleteStudentsResult.set({
        ok: true,
        message: `${plural(this.studentCount() ?? 0, 'student')} deleted.`,
      });
    } catch (error) {
      console.error('Failed to delete students', error);
      this.deleteStudentsResult.set({
        ok: false,
        message: 'The students could not be deleted. Nothing was changed.',
      });
    } finally {
      this.deletingStudents.set(false);
      this.showDeleteStudentsPopup.set(false);
    }
  }
}
