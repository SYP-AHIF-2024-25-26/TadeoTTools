import { Component, inject, signal, WritableSignal } from '@angular/core';
import { StudentService } from '@/core/services/student.service';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { FeedbackService } from '@/core/services/feedback.service';
import { StopService } from '@/core/services/stop.service';
import { DivisionService } from '@/core/services/division.service';
import { downloadFile } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { FeatureFlagService } from '@/core/services/feature-flag.service';
import { FormsModule } from '@angular/forms';
import { errorText, ToastService } from '@/core/services/toast.service';
import { ImportResult } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
type ImportKind = 'students' | 'stopManagers' | 'assignments';
type ImportFeedback = { ok: boolean; message: string };

@Component({
  selector: 'app-data-page',
  imports: [DeletePopupComponent, FormsModule],
  templateUrl: './data-page.component.html',
})
export class DataPageComponent {
  selectedStudentFile: WritableSignal<File | null> = signal(null);
  selectedStopManagerFile: WritableSignal<File | null> = signal(null);
  showDeleteStudentsPopup = signal<boolean>(false);
  showCountdown = signal<boolean>(false);
  countdownValue = signal<string>('');

  private studentService = inject(StudentService);
  private stopManagerService = inject(StopManagerService);
  private feedbackService = inject(FeedbackService);
  private stopService = inject(StopService);
  private divisionService = inject(DivisionService);
  private featureFlagService = inject(FeatureFlagService);
  private toast = inject(ToastService);

  async ngOnInit() {
    try {
      const showCountdown = await this.featureFlagService.getShowCountdown();

      this.showCountdown.set(showCountdown.isEnabled);
      this.countdownValue.set(showCountdown.value);
    } catch (e) {
      console.error('Failed to load feature flag', e);
      this.toast.error('The countdown settings could not be loaded.');
    }
  }

  async setShowCountdown() {
    try {
      this.showCountdown.update((v) => !v);
      await this.featureFlagService.updateShowCountdown(
        this.showCountdown(),
        this.countdownValue()
      );
      this.toast.success(
        this.showCountdown()
          ? 'The countdown is now shown in the visitor app.'
          : 'The countdown is now hidden in the visitor app.'
      );
    } catch (e) {
      console.error('Failed to update feature flag', e);
      // Revert on failure
      this.showCountdown.update((v) => !v);
      this.toast.error(
        errorText(e, 'The countdown setting could not be saved.')
      );
    }
  }

  async updateShowdownValue() {
    try {
      await this.featureFlagService.updateShowCountdown(
        this.showCountdown(),
        this.countdownValue()
      );
      this.toast.success('Countdown date saved.');
    } catch (e) {
      console.error('Failed to update countdown value', e);
      this.toast.error(errorText(e, 'The countdown date could not be saved.'));
    }
  }

  onStudentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentFile.set(input.files[0]);
    }
  }

  onStopManagerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStopManagerFile.set(input.files[0]);
    }
  }

  async downloadQuestionAnswers() {
    try {
      const blob = await this.feedbackService.getFeedbackQuestionAnswersFile();
      downloadFile(blob, 'feedback_answers.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The feedback answers could not be downloaded.')
      );
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

  async downloadStopsData() {
    try {
      const blob = await this.stopService.getStopsDataFile();
      downloadFile(blob, 'stops_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The stops data could not be downloaded.')
      );
    }
  }

  async downloadDivisionData() {
    try {
      const blob = await this.divisionService.getDivisionDataFile();
      downloadFile(blob, 'division_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The division data could not be downloaded.')
      );
    }
  }

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

  selectedStudentAssignmentFile: WritableSignal<File | null> = signal(null);

  onStudentAssignmentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentAssignmentFile.set(input.files[0]);
    }
  }

  importing = signal<ImportKind | null>(null);
  importResults = signal<Partial<Record<ImportKind, ImportFeedback>>>({});

  submitStudentsCsv() {
    return this.runImport(
      'students',
      this.selectedStudentFile(),
      (file) => this.studentService.uploadStudentsCsv(file),
      'student'
    );
  }

  submitStopManagersCsv() {
    return this.runImport(
      'stopManagers',
      this.selectedStopManagerFile(),
      (file) => this.stopManagerService.uploadStopManagersCsv(file),
      'stop manager'
    );
  }

  submitStudentAssignmentsCsv() {
    return this.runImport(
      'assignments',
      this.selectedStudentAssignmentFile(),
      (file) => this.studentService.uploadStudentAssignmentsCsv(file),
      'assignment'
    );
  }

  private async runImport(
    kind: ImportKind,
    file: File | null,
    upload: (file: File) => Promise<ImportResult>,
    noun: string
  ) {
    if (!file || this.importing()) {
      return;
    }
    this.importing.set(kind);
    this.setImportResult(kind, undefined);
    try {
      const result = await upload(file);
      let message = `Imported ${plural(result.added, noun)}.`;
      if (result.skipped > 0) {
        message += ` ${plural(result.skipped, 'row')} skipped because ${
          result.skipped === 1 ? 'it' : 'they'
        } already existed.`;
      }
      this.setImportResult(kind, { ok: true, message });
    } catch (error) {
      console.error('Error uploading CSV:', error);
      this.setImportResult(kind, {
        ok: false,
        message: errorText(
          error,
          'The import failed. Check that the file matches the format shown below.'
        ),
      });
    } finally {
      this.importing.set(null);
    }
  }

  private setImportResult(
    kind: ImportKind,
    feedback: ImportFeedback | undefined
  ) {
    this.importResults.update((results) => ({ ...results, [kind]: feedback }));
  }
}
