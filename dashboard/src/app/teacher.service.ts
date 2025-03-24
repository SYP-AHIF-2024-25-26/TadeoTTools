import {inject, Injectable} from '@angular/core';
import {Student, Teacher} from "./types";
import {firstValueFrom} from "rxjs";
import {BASE_URL} from "./app.config";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  baseUrl = inject(BASE_URL);
  httpClient = inject(HttpClient);

  constructor() { }

  async getTeachers() {
      return firstValueFrom(
        this.httpClient.get<Teacher[]>(this.baseUrl + '/api/teachers')
      );
  }
}
