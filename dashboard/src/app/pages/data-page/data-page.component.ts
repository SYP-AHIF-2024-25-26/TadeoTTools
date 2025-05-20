import {Component, inject, signal, WritableSignal} from '@angular/core';
import {StudentService} from "../../student.service";
import {TeacherService} from "../../teacher.service";
import {FeedbackService} from "../../feedback.service";

@Component({
  selector: 'app-data-page',
  imports: [],
  templateUrl: './data-page.component.html',
  styleUrl: './data-page.component.css',
  standalone: true,
})
export class DataPageComponent {

  selectedStudentFile: WritableSignal<File | null> = signal(null);
  selectedTeacherFile: WritableSignal<File | null> = signal(null);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private feedbackService = inject(FeedbackService)

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
    console.log(input.files);
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

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'feedback_answers.csv'; // Match the name from your backend

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download feedback answers');
    }
  }
}
