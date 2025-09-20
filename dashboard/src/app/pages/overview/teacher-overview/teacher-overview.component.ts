import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../../teacher.service';
import { Teacher } from '../../../types';

@Component({
  selector: 'app-teacher-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-overview.component.html'
})
export class TeacherOverviewComponent {
  private teacherService = inject(TeacherService);

  teachers = signal<Teacher[]>([]);
  editingTeacher = signal<Teacher | null>(null);
  newTeacher = signal<Partial<Teacher>>({});
  searchQuery = signal('');

  filteredTeachers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.teachers();

    return this.teachers().filter(teacher =>
      teacher.edufsUsername.toLowerCase().includes(query) ||
      teacher.firstName.toLowerCase().includes(query) ||
      teacher.lastName.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.loadTeachers();
  }

  async loadTeachers() {
    try {
      const teachers = await this.teacherService.getTeachers();
      this.teachers.set(teachers.sort((a, b) => a.lastName.localeCompare(b.lastName)));
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  }

  startEdit(teacher: Teacher) {
    this.editingTeacher.set({ ...teacher });
  }

  async saveEdit() {
    if (this.editingTeacher()) {
      try {
        await this.teacherService.updateTeacher(this.editingTeacher()!);
        await this.loadTeachers();
        this.editingTeacher.set(null);
      } catch (error) {
        console.error('Failed to update teacher:', error);
      }
    }
  }

  cancelEdit() {
    this.editingTeacher.set(null);
  }

  async deleteTeacher(edufsUsername: string) {
    try {
      await this.teacherService.deleteTeacher(edufsUsername);
      await this.loadTeachers();
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    }
  }

  async addTeacher() {
    if (this.newTeacher()?.edufsUsername && this.newTeacher()?.firstName && this.newTeacher()?.lastName) {
      try {
        console.log(this.newTeacher());
        await this.teacherService.postTeacher(this.newTeacher() as Teacher);
        await this.loadTeachers();
        this.newTeacher.set({});
      } catch (error) {
        console.error('Failed to add teacher:', error);
      }
    }
  }
}
