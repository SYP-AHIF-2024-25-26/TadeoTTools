import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StopService } from '../../stop.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Division, Status, Stop, StopGroup, Student, StudentAssignment } from '../../types';
import { isValid } from '../../utilfunctions';
import { firstValueFrom } from 'rxjs';
import { Location, NgClass } from '@angular/common';
import { TeacherStore } from '../../store/teacher.store';
import { LoginService } from '../../login.service';
import { StudentStore } from '../../store/student.store';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import { sortStudents } from '../../utilfunctions';
import { DivisionService } from '../../division.service';
import { StopGroupService } from '../../stopgroup.service';

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [FormsModule, RouterModule, NgClass, DeletePopupComponent],
  templateUrl: './stop-details.component.html',
})
export class StopDetailsComponent implements OnInit {
  private divisionService = inject(DivisionService);
  private stopGroupService = inject(StopGroupService);
  private stopService = inject(StopService);
  private loginService = inject(LoginService);

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  protected teacherStore = inject(TeacherStore);
  protected studentStore = inject(StudentStore);
  private service: StopService = inject(StopService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);
  private originalAssignments = new Map<string, StudentAssignment[]>();

  router = inject(Router);

  emptyStop = {
    id: -1,
    name: '',
    description: '',
    roomNr: '',
    divisionIds: [],
    stopGroupIds: [],
    teachers: [],
    orders: [],
  };
  stop = signal<Stop>(this.emptyStop);
  isAdmin = signal(false);
  selectedClass = signal<string>('all');
  studentFilterText = signal<string>('');
  teacherFilterText = signal<string>('');

  // Separate filter signals for each list
  assignedStudentFilterText = signal<string>('');
  availableStudentFilterText = signal<string>('');
  assignedTeacherFilterText = signal<string>('');
  availableTeacherFilterText = signal<string>('');
  selectedAssignedClass = signal<string>('all');
  selectedAvailableClass = signal<string>('all');

  inactiveDivisions = computed(() => this.divisions().filter((d) => !this.stop()?.divisionIds.includes(d.id)));

  errorMessage = signal<string | null>(null);

  // Popup signals and properties
  showRemoveDivisionPopup = signal<boolean>(false);
  showRemoveTeacherPopup = signal<boolean>(false);
  showRemoveStudentPopup = signal<boolean>(false);
  divisionIdToRemove: string = '';
  teacherUsernameToRemove: string = '';
  studentUsernameToRemove: string = '';

  // No longer tracking badge position

  // Section expansion states
  expandedSections = signal<{[key: string]: boolean}>({
    students: true,
    teachers: true,
    divisions: true
  });

  toggleSection(section: string) {
    this.expandedSections.update(sections => {
      return { ...sections, [section]: !sections[section] };
    });
  }

  teachersAssignedToStop = computed(() => {
    return this.teacherStore.teachers().filter((teacher) =>
      teacher.assignedStops.some((assignment) => assignment == this.stop().id)
    );
  });

  teachersAvailableForAssignment = computed(() => {
    const assignedTeachers = this.teachersAssignedToStop();
    return this.teacherStore.teachers().filter((teacher) => !assignedTeachers.includes(teacher));
  });

  // Filter function to apply common filtering logic for teachers
  private applyTeacherFilters(teachers: any[], filterText: string) {
    let filteredTeachers = teachers;

    if (filterText.trim() !== '') {
      const searchText = filterText.toLowerCase().trim();
      filteredTeachers = filteredTeachers.filter(teacher =>
        teacher.firstName.toLowerCase().includes(searchText) ||
        teacher.lastName.toLowerCase().includes(searchText) ||
        teacher.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return filteredTeachers;
  }

  // Filtered teachers assigned to the stop
  filteredAssignedTeachers = computed(() => {
    return this.applyTeacherFilters(this.teachersAssignedToStop(), this.assignedTeacherFilterText());
  });

  teachersNotInStop = computed(() => {
    return this.applyTeacherFilters(this.teachersAvailableForAssignment(), this.availableTeacherFilterText());
  });

  availableClasses = computed(() => {
    const classes = this.studentStore.students().map(student => student.studentClass);
    return ['all', ...new Set(classes)].filter(Boolean);
  });

  // Filter function to apply common filtering logic for students
  private applyStudentFilters(students: any[], filterText: string, selectedClass: string) {
    let filteredStudents = students;

    if (selectedClass !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.studentClass === selectedClass);
    }

    if (filterText.trim() !== '') {
      const searchText = filterText.toLowerCase().trim();
      filteredStudents = filteredStudents.filter(student =>
        student.firstName.toLowerCase().includes(searchText) ||
        student.lastName.toLowerCase().includes(searchText) ||
        student.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return sortStudents(filteredStudents);
  }

  // Filtered students assigned to the stop
  filteredAssignedStudents = computed(() => {
    const assignedStudents = this.studentStore.getStudentsByStopId(this.stop().id);
    return sortStudents(this.applyStudentFilters(assignedStudents, this.assignedStudentFilterText(), this.selectedAssignedClass()));
  });

  studentsNotInStop = computed(() => {
    const wrongStudents = this.studentStore.getStudentsByStopId(this.stop().id);
    let filteredStudents = this.studentStore.students().filter((student) => !wrongStudents.includes(student));
    return sortStudents(this.applyStudentFilters(filteredStudents, this.availableStudentFilterText(), this.selectedAvailableClass()));
  });

  async ngOnInit() {
    try {
      // Check if user is admin
      const response = await this.loginService.performCall('is-admin');
      this.isAdmin.set(response.includes('admin'));

      // Get stop ID from route parameters
      const params = await firstValueFrom(this.route.queryParams);
      const id = params['id'] || -1;

      // If this is a new stop (id = -1), no need to fetch existing stop
      if (id === -1) {
        return;
      }

      this.divisions.set(await this.divisionService.getDivisions());
      this.stopGroups.set(await this.stopGroupService.getStopGroups());

      let foundStop: Stop | undefined;

      foundStop = await this.stopService.getStopById(Number(id));
      if (foundStop === undefined) {
        this.errorMessage.set(`Could not find stop with ID ${id}`);
      } else {
        this.stop.set({ ...foundStop });
        const students = this.studentStore.getStudentsByStopId(foundStop.id);
        students.forEach(s => {
          const assignments = s.studentAssignments
            .filter(a => a.stopId === foundStop!.id)
            .map(a => ({ ...a }));
          this.originalAssignments.set(s.edufsUsername, assignments);
        });
      }
    } catch (error) {
      this.errorMessage.set(`Error initializing component: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  isInputValid() {
    if (!isValid(this.stop().name, 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValid(this.stop().description, 255)) {
      this.errorMessage.set('Description must be between 1 and 255 characters');
      return false;
    }
    if (!isValid(this.stop().roomNr, 50)) {
      this.errorMessage.set('Room number must be between 1 and 50 characters');
      return false;
    }
    return true;
  }

  async submitStopDetail() {
    if (!this.isInputValid()) {
      return;
    }

    if (this.stop().id === -1) {
      // Store teachers assigned to the temporary stop
      const tempAssignedTeachers = this.teachersAssignedToStop();

        const returnedStop = await this.service.addStop(this.stop());
        this.stop.set({ ...this.stop(), id: returnedStop.id });

        this.studentStore.setStopIdForAssignmentsOnNewStop(returnedStop.id);
        this.teacherStore.setStopIdForAssignmentsOnNewStop(returnedStop.id);
    } else {
      await this.stopService.updateStop(this.stop());
    }

      this.studentStore.getStudentsByStopId(this.stop().id).forEach((student) => {
        this.studentStore.setAssignments(student.edufsUsername);
      });

      this.teacherStore.getTeachersByStopId(this.stop().id).forEach((teacher) => {
        this.teacherStore.setAssignments(teacher.edufsUsername);
      });

    this.stop.set(this.emptyStop);
    this.location.back();
  }

  async deleteAndGoBack() {
    await this.stopService.deleteStop(this.stop().id);
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  goBack() {
    if (this.stop().id !== -1) {
      const currentStudents = this.studentStore.getStudentsByStopId(this.stop().id);
      currentStudents.forEach(student => {
        this.studentStore.removeStopFromStudent(student.edufsUsername, this.stop().id);
      });
      this.originalAssignments.forEach((assignments, username) => {
        assignments.forEach(a => this.studentStore.addStopToStudent({ ...a }));
      });
    } else {
      this.studentStore.getStudentsByStopId(-1).forEach((student) => {
        this.studentStore.removeStopFromStudent(student.edufsUsername, -1);
      });
    }
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  async onDivisionSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const divisionId = parseInt(target.value);
    if (!this.stop().divisionIds.includes(divisionId) && this.divisions().find((d) => d.id === divisionId)) {
      this.stop.update((stop) => {
        stop.divisionIds = [divisionId, ...stop.divisionIds];
        return stop;
      });
    }
  }

  onClassSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    this.selectedClass.set(target.value);
  }

  async onStudentClick(edufsUsername: string) {
    // Add the student to the stop
    const assignment = {
      studentId: edufsUsername,
      stopId: this.stop().id,
      status: Status.Pending,
    } as StudentAssignment;
    await this.studentStore.addStopToStudent(assignment);
  }

  // Keep for backward compatibility
  async onStudentSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const edufsUsername = target.value;
    await this.onStudentClick(edufsUsername);
  }

  async onTeacherSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const edufsUsername = target.value;
    await this.teacherStore.addStopToTeacher(edufsUsername, this.stop().id);
  }

  selectDivisionToRemove(divisionId: string) {
    this.divisionIdToRemove = divisionId;
    this.showRemoveDivisionPopup.set(true);
  }

  confirmDivisionRemove() {
    this.stop.update((stop) => {
      stop.divisionIds = stop.divisionIds.filter((ids) => ids !== Number.parseInt(this.divisionIdToRemove));
      return stop;
    });
    this.showRemoveDivisionPopup.set(false);
  }

  selectTeacherToRemove(edufsUsername: string) {
    this.teacherUsernameToRemove = edufsUsername;
    this.showRemoveTeacherPopup.set(true);
  }

  confirmTeacherRemove() {
    this.teacherStore.removeStopFromTeacher(this.teacherUsernameToRemove, this.stop().id);
    this.showRemoveTeacherPopup.set(false);
  }

  selectStudentToRemove(edufsUsername: string) {
    this.studentUsernameToRemove = edufsUsername;
    this.showRemoveStudentPopup.set(true);
  }

  confirmStudentRemove() {
    this.studentStore.removeStopFromStudent(this.studentUsernameToRemove, this.stop().id);
    this.showRemoveStudentPopup.set(false);
  }

  // Keep for backward compatibility
  onDivisionRemove(divisionId: string) {
    this.selectDivisionToRemove(divisionId);
  }

  onTeacherRemove(edufsUsername: string) {
    this.teacherStore.removeStopFromTeacher(edufsUsername, this.stop().id);
  }

  onStudentRemove(edufsUsername: string) {
    this.studentStore.removeStopFromStudent(edufsUsername, this.stop().id);
  }

  // No longer need to toggle badge position

  resetFilters() {
    this.assignedStudentFilterText.set('');
    this.availableStudentFilterText.set('');
    this.assignedTeacherFilterText.set('');
    this.availableTeacherFilterText.set('');
    this.selectedAssignedClass.set('all');
    this.selectedAvailableClass.set('all');
  }

  getAssignmentStatus(student: Student): Status {
    const assignment = student.studentAssignments.find(a => a.stopId === this.stop().id);
    return assignment ? assignment.status : Status.Pending;
  }

  getStatusLabel(status: Status): string {
    switch(status) {
      case Status.Pending: return 'Pending';
      case Status.Accepted: return 'Accepted';
      case Status.Declined: return 'Declined';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: Status): string {
    switch(status) {
      case Status.Pending: return 'bg-yellow-200 text-yellow-800';
      case Status.Accepted: return 'bg-green-200 text-green-800';
      case Status.Declined: return 'bg-red-200 text-red-800';
      default: return '';
    }
  }

  async onTeacherClick(edufsUsername: string) {
    await this.teacherStore.addStopToTeacher(edufsUsername, this.stop().id);
  }

  onAssignedClassSelect($event: Event) {
    this.selectedAssignedClass.set(($event.target as HTMLSelectElement).value);
  }

  onAvailableClassSelect($event: Event) {
    this.selectedAvailableClass.set(($event.target as HTMLSelectElement).value);
  }

  protected readonly Status = Status;

  getDivisionById(id: number): Division | undefined {
    return this.divisions().find(d => d.id === id);
  }

  getStopGroupById(id: number) {
    return this.stopGroups().find(sg => sg.id === id);
  }
}