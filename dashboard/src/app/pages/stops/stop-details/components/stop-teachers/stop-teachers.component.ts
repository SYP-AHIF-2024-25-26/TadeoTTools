import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Stop, Teacher } from '@/shared/models/types';

@Component({
  selector: 'app-stop-teachers',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './stop-teachers.component.html',
})
export class StopTeachersComponent {
  stop = model.required<Stop>();
  teachers = input.required<Teacher[]>();
  isAdmin = input.required<boolean>();

  assignedTeacherFilterText = signal<string>('');
  availableTeacherFilterText = signal<string>('');
  isExpanded = signal<boolean>(true);

  toggle() {
    this.isExpanded.update((v) => !v);
  }

  teachersAssignedToStop = computed(() => {
    return this.stop().teacherAssignments
      ? this.stop()
          .teacherAssignments.map((a) =>
            this.teachers().find((t) => t.edufsUsername === a)
          )
          .filter((t): t is Teacher => t !== undefined)
      : [];
  });

  teachersAvailableForAssignment = computed(() => {
    const assignedTeachers = this.teachersAssignedToStop();
    return this.teachers().filter(
      (teacher) => !assignedTeachers.includes(teacher)
    );
  });

  private applyTeacherFilters(teachers: any[], filterText: string) {
    let filteredTeachers = teachers;

    if (filterText.trim() !== '') {
      const searchText = filterText.toLowerCase().trim();
      filteredTeachers = filteredTeachers.filter(
        (teacher) =>
          teacher.firstName.toLowerCase().includes(searchText) ||
          teacher.lastName.toLowerCase().includes(searchText) ||
          teacher.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return filteredTeachers;
  }

  filteredAssignedTeachers = computed(() => {
    return this.applyTeacherFilters(
      this.teachersAssignedToStop(),
      this.assignedTeacherFilterText()
    );
  });

  teachersNotInStop = computed(() => {
    return this.applyTeacherFilters(
      this.teachersAvailableForAssignment(),
      this.availableTeacherFilterText()
    );
  });

  addTeacher(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      teacherAssignments: [...(stop.teacherAssignments || []), edufsUsername],
    }));
  }

  removeTeacher(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      teacherAssignments: (stop.teacherAssignments || []).filter(
        (a) => a !== edufsUsername
      ),
    }));
  }
}
