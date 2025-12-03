import { Component, inject, signal, WritableSignal } from '@angular/core';
import { StudentService } from '../../../student.service';
import { TeacherService } from '../../../teacher.service';
import { FeedbackService } from '../../../feedback.service';
import { StopGroupService } from '../../../stopgroup.service';
import { StopService } from '../../../stop.service';
import { DivisionService } from '../../../division.service';
import { downloadFile } from '../../../utilfunctions';

@Component({
  selector: 'app-data-page',
  imports: [],
  templateUrl: './data-page.component.html',
  standalone: true,
})
export class DataPageComponent {
  selectedStudentFile: WritableSignal<File | null> = signal(null);
  selectedTeacherFile: WritableSignal<File | null> = signal(null);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private feedbackService = inject(FeedbackService);
  private stopService = inject(StopService);
  private stopGroupService = inject(StopGroupService);
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

  onTeacherFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedTeacherFile.set(input.files[0]);
    }
  }

  async submitTeachersCsv(): Promise<void> {
    if (!this.selectedTeacherFile) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      await this.teacherService.uploadTeachersCsv(
        this.selectedTeacherFile() as File
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
}
