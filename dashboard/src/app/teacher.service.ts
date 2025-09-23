import { inject, Injectable } from '@angular/core';
import { Teacher, TeacherAssignment } from './types';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from './app.config';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  private baseUrl = inject(BASE_URL);
  private httpClient = inject(HttpClient);

  getTeachers() {
    return firstValueFrom(
      this.httpClient.get<Teacher[]>(`${this.baseUrl}/api/teachers`)
    );
  }

  postTeacher(teacher: Teacher) {
    return firstValueFrom(
      this.httpClient.post<void>(`${this.baseUrl}/api/teachers`, teacher)
    );
  }

  deleteTeacher(edufsUsername: string) {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/teachers/${edufsUsername}`)
    );
  }

  updateTeacher(teacher: Teacher) {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/teachers`, teacher)
    );
  }

  setAssignments(edufsUsername: string, assignments: number[]) {
    const teacherAssignments = assignments.map(stopId => ({
      stopId,
      teacherId: edufsUsername
    } as TeacherAssignment));

    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/teachers/${edufsUsername}/assignments`,
        teacherAssignments
      )
    );
  }

  uploadTeachersCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return firstValueFrom(
      this.httpClient.post<void>(`${this.baseUrl}/api/teachers/upload`, formData)
    );
  }
}
