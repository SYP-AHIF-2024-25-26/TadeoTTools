import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { Student, StudentAssignment } from './types';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  async getStudents(): Promise<Student[]> {
    return firstValueFrom(this.httpClient.get<Student[]>(this.baseUrl + '/api/students'));
  }

  async updateStudent(student: Student): Promise<void> {
    return firstValueFrom(this.httpClient.put<void>(this.baseUrl + '/api/students/' + student.edufsUsername, student));
  }

  async setAssignments(edufsUsername: string, assignments: StudentAssignment[]): Promise<void> {
    return firstValueFrom(this.httpClient.put<void>(this.baseUrl + '/api/students/' + edufsUsername + '/assignments', assignments));
  }
}
