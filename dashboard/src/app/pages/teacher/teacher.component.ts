import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TeacherStore } from '../../store/teacher.store';
import Keycloak from 'keycloak-js';
import { StopStore } from '../../store/stop.store';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-teacher',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './teacher.component.html',
})
export class TeacherComponent implements OnInit {
  keycloak = inject(Keycloak);
  protected teacherStore = inject(TeacherStore);
  protected stopStore = inject(StopStore);
  username = signal<string>('');
  teacher = computed(() => {
    return this.teacherStore.getTeacherById(this.username());
  });

  async ngOnInit() {
    const userProfile = await this.keycloak.loadUserProfile();
    this.username.set(userProfile.username || '');
  }
}
