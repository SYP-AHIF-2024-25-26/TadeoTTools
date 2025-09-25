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

  getTeacherById(edufsUsername: string) {
    return firstValueFrom(
      this.httpClient.get<Teacher>(`${this.baseUrl}/api/teachers/${edufsUsername}`)
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

  addStopToTeacher(edufsUsername: string, stopId: number) {
    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/teachers/${edufsUsername}/assignments`,
        [
          {
            stopId,
            teacherId: edufsUsername
          } as TeacherAssignment
        ]
      )
    );
  }

  updateTeacher(teacher: Teacher) {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/teachers`, teacher)
    );
  }

  setAssignments(edufsUsername: string, assignments: number[]) {
    const teacherAssignments: TeacherAssignment[] = assignments.map(stopId => ({
      stopId,
      teacherId: edufsUsername
    }));

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
  async getTeachersNotInStop(stopId: number): Promise<Teacher[]> {
    const wrongTeachers = (await this.getTeachers()).filter((teacher) => {
      if (teacher.assignedStops) {
        return teacher.assignedStops.some((assignment) => assignment === stopId);
      }
      return false;
    });
    return (await this.getTeachers()).filter((teacher) => !wrongTeachers.includes(teacher));
  }
  async removeStopFromTeacher(edufsUsername: string, stopId: number) {
    const teacher = (await this.getTeachers()).find((teacher) => teacher.edufsUsername === edufsUsername);
    if (teacher) {
      teacher.assignedStops = teacher.assignedStops.filter((assignment) => assignment !== stopId);
      await this.updateTeacher(teacher);
    }
  }
  async setStopIdForAssignmentsOnNewStop(stopId: number) {
    (await this.getTeachers()).forEach((teacher) => {
      if (teacher.assignedStops.includes(-1)) {
        teacher.assignedStops = teacher.assignedStops.map((assignment) => (assignment === -1 ? stopId : assignment));
      }
    });
    (await this.getTeachers()).forEach(async (teacher) => {
      await this.updateTeacher(teacher);
    });
  }
}
