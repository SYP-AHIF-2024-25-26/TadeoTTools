import {Component, inject, signal, WritableSignal} from '@angular/core';
import {StudentService} from "../../student.service";
import {TeacherService} from "../../teacher.service";
import {FeedbackService} from "../../feedback.service";
import { StopGroupService } from '../../stopgroup.service';
import { StopService } from '../../stop.service';
import { DivisionService } from '../../division.service';

@Component({
  selector: 'app-data-page',
  imports: [],
  templateUrl: './data-page.component.html',
  standalone: true
})
export class DataPageComponent {

  selectedStudentFile: WritableSignal<File | null> = signal(null);
  selectedTeacherFile: WritableSignal<File | null> = signal(null);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private feedbackService = inject(FeedbackService)
  private stopService = inject(StopService)
  private stopGroupService = inject(StopGroupService)
  private divisionService = inject(DivisionService)

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
      await this.studentService.uploadStudentsCsv(this.selectedStudentFile() as File);
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
      await this.teacherService.uploadTeachersCsv(this.selectedTeacherFile() as File);
      location.reload();
    } catch (error) {
      console.error('Error uploading CSV:', error);
    }
  }

  async downloadQuestionAnswers() {
    try {
      const blob = await this.feedbackService.getFeedbackQuestionAnswersFile();
      this.downloadFile(blob, 'feedback_answers.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download feedback answers');
    }
  }

  async downloadStopData() {
    try {
      const blob = await this.stopService.getStopDataFile();
      this.downloadFile(blob, 'stop_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download stop data');
    }
  }

  async downloadStopGroupData() {
    try {
      const blob = await this.stopGroupService.getStopGroupDataFile();
      this.downloadFile(blob, 'stop_group_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download stop group data');
    }
  }

  async downloadDivisionData() {
    try {
      const blob = await this.divisionService.getDivisionDataFile();
      this.downloadFile(blob, 'division_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download division data');
    }
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
