import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TeacherStore } from '../../store/teacher.store';
import Keycloak from 'keycloak-js';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StopService } from '../../stop.service';
import { Stop } from '../../types';

@Component({
  selector: 'app-teacher',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './teacher.component.html',
})
export class TeacherComponent implements OnInit {
  private stopService = inject(StopService);
  stops = signal<Stop[]>([]);
  keycloak = inject(Keycloak);

  protected teacherStore = inject(TeacherStore);
  username = signal<string>('');
  teacher = computed(() => {
    return this.teacherStore.getTeacherById(this.username());
  });

  async ngOnInit() {
    const userProfile = await this.keycloak.loadUserProfile();
    this.username.set(userProfile.username || '');
    this.stops.set(await this.stopService.getStopsOfTeacher(this.username()));
  }
}
