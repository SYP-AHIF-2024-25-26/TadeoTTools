import { Component, inject, signal, WritableSignal } from '@angular/core';
import { StudentService } from '@/core/services/student.service';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { FeedbackService } from '@/core/services/feedback.service';
import { StopService } from '@/core/services/stop.service';
import { DivisionService } from '@/core/services/division.service';
import { downloadFile } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
@Component({
  selector: 'app-data-page',
  imports: [DeletePopupComponent],
  templateUrl: './data-page.component.html',
  standalone: true,
})
export class DataPageComponent {
  selectedStudentFile: WritableSignal<File | null> = signal(null);
  selectedStopManagerFile: WritableSignal<File | null> = signal(null);
  showDeleteStudentsPopup = signal<boolean>(false);

  private studentService = inject(StudentService);
  private stopManagerService = inject(StopManagerService);
  private feedbackService = inject(FeedbackService);
  private stopService = inject(StopService);
  private divisionService = inject(DivisionService);

  onStudentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentFile.set(input.files[0]);
    }
  }

  async submitStudentsCsv(): Promise<void> {
    if (!this.selectedStudentFile) {
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

  onStopManagerFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStopManagerFile.set(input.files[0]);
    }
  }

  async submitStopManagersCsv(): Promise<void> {
    if (!this.selectedStopManagerFile) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      await this.stopManagerService.uploadStopManagersCsv(
        this.selectedStopManagerFile() as File
      );
      location.reload();
    } catch (error) {
      console.error('Error uploading CSV:', error);
    }
  }

  async downloadQuestionAnswers() {
    try {
      const blob = await this.feedbackService.getFeedbackQuestionAnswersFile();
      downloadFile(blob, 'feedback_answers.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download feedback answers');
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

  async downloadStopsData() {
    try {
      const blob = await this.stopService.getStopsDataFile();
      downloadFile(blob, 'stops_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download stops data');
    }
  }

  async downloadDivisionData() {
    try {
      const blob = await this.divisionService.getDivisionDataFile();
      downloadFile(blob, 'division_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download division data');
    }
  }

  async deleteAllStudents() {
    await this.studentService.deleteAllStudents();
  }

  selectedStudentAssignmentFile: WritableSignal<File | null> = signal(null);

  onStudentAssignmentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentAssignmentFile.set(input.files[0]);
    }
  }

  async submitStudentAssignmentsCsv(): Promise<void> {
    if (!this.selectedStudentAssignmentFile()) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      await this.studentService.uploadStudentAssignmentsCsv(
        this.selectedStudentAssignmentFile() as File
      );
      alert('Student assignments imported successfully!');
      location.reload();
    } catch (error: any) {
      console.error('Error uploading CSV:', error);

      // Extract error message from backend response
      let errorMessage =
        'Failed to import student assignments. Please check the file format.';

      if (error?.error) {
        // If error.error is a string, use it directly
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        // If error.error has a message property
        else if (error.error?.message) {
          errorMessage = error.error.message;
        }
      }
      // If error has a message property directly
      else if (error?.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    }
  }
}
