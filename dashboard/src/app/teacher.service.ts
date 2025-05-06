import { inject, Injectable } from '@angular/core';
import { Student, StudentAssignment, Teacher, TeacherAssignment } from './types';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from './app.config';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  baseUrl = inject(BASE_URL);
  httpClient = inject(HttpClient);

  constructor() {}

  async getTeachers() {
    return firstValueFrom(this.httpClient.get<Teacher[]>(this.baseUrl + '/api/teachers'));
  }

  async setAssignments(edufsUsername: string, assignments: number[]): Promise<void> {
    return firstValueFrom(this.httpClient.put<void>(this.baseUrl + '/api/teachers/' + edufsUsername + '/assignments', assignments.map(a => ({id: a, teacherId: edufsUsername} as TeacherAssignment))));
  }
}
