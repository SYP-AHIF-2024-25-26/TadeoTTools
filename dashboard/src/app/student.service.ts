import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { Student, StudentAssignment, Info } from './types';
import { firstValueFrom } from 'rxjs';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);

  async getStudents(): Promise<Student[]> {
    try {
      return await firstValueFrom(this.httpClient.get<Student[]>(this.baseUrl + '/api/students'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get students' });
      throw error;
    }
  }

  async updateStudent(student: Student): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.put<void>(this.baseUrl + '/api/students/' + student.edufsUsername, student));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated student' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update student' });
      throw error;
    }
  }

  async setAssignments(edufsUsername: string, assignments: StudentAssignment[]): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.put<void>(this.baseUrl + '/api/students/' + edufsUsername + '/assignments', assignments));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to set student assignments' });
      throw error;
    }
  }

  async uploadStudentsCsv(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await firstValueFrom(this.httpClient.post<void>(this.baseUrl + '/api/students/upload', formData));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully uploaded students CSV' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to upload students CSV' });
      throw error;
    }
  }
}
