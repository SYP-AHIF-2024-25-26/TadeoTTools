import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { Student, StudentAssignment } from './types';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getStudents(): Promise<Student[]> {
    return firstValueFrom(
      this.httpClient.get<Student[]>(`${this.baseUrl}/api/students`)
    );
  }

  updateStudent(student: Student): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/students/${student.edufsUsername}`,
        student
      )
    );
  }

  setAssignments(edufsUsername: string, assignments: StudentAssignment[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/students/${edufsUsername}/assignments`,
        assignments
      )
    );
  }

  uploadStudentsCsv(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    return firstValueFrom(
      this.httpClient.post<void>(`${this.baseUrl}/api/students/upload`, formData)
    );
  }

  deleteAllStudents(): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/students`)
    );
  }

  getStudentsDataFile(): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}/api/students/csv`, {
        responseType: 'blob'
      })
    );
  }

  async setStopIdForAssignmentsOnNewStop(stopId: number) {
    (await this.getStudents()).forEach((student) => {
      student.studentAssignments.forEach((assignment) => {
        if (assignment.stopId === -1) {
          assignment.stopId = stopId;
        }
      });
    });
    (await this.getStudents()).forEach(async (student) => {
      await this.updateStudent(student);
    });
  }
}
