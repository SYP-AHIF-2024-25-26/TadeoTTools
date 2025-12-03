import { Component, computed, inject, OnInit, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StopService } from '../../stop.service';
import { Stop, Teacher } from '../../types';
import { TeacherService } from '../../teacher.service';

@Component({
  selector: 'app-teacher',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './teacher.component.html',
})
export class TeacherComponent implements OnInit {
  private stopService = inject(StopService);
  private teacherService = inject(TeacherService);
  stops = signal<Stop[]>([]);
  keycloak = inject(Keycloak);

  username = signal<string>('');
  teacher = signal<Teacher | null>(null);

  async ngOnInit() {
    const userProfile = await this.keycloak.loadUserProfile();
    const username = userProfile.username || '';
    this.username.set(username);
    this.stops.set(await this.stopService.getStopsOfTeacher(username));
    try {
      this.teacher.set(await this.teacherService.getTeacherById(username));
    } catch (e) {
      console.error('Failed to load teacher profile', e);
    }
  }
}
