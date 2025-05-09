import { inject, Injectable } from '@angular/core';
import { Teacher, TeacherAssignment, Info } from './types';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from './app.config';
import { HttpClient } from '@angular/common/http';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class TeacherService {
  baseUrl = inject(BASE_URL);
  httpClient = inject(HttpClient);
  private readonly infoStore = inject(InfoStore);

  constructor() {}

  async getTeachers() {
    try {
      return await firstValueFrom(this.httpClient.get<Teacher[]>(this.baseUrl + '/api/teachers'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get teachers' });
      throw error;
    }
  }

  async setAssignments(edufsUsername: string, assignments: number[]): Promise<void> {
    try {
      console.log(edufsUsername, assignments);
      await firstValueFrom(this.httpClient.put<void>(this.baseUrl + '/api/teachers/' + edufsUsername + '/assignments', assignments.map(a => ({stopId: a, teacherId: edufsUsername} as TeacherAssignment))));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully set teacher assignments' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to set teacher assignments' });
      throw error;
    }
  }
}
