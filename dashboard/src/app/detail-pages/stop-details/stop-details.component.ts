import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StopService } from '../../stop.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Status, Stop, StudentAssignment } from '../../types';
import { isValid } from '../../utilfunctions';
import { firstValueFrom } from 'rxjs';
import { Location, NgClass } from '@angular/common';
import { StopStore } from '../../store/stop.store';
import { DivisionStore } from '../../store/division.store';
import { StopGroupStore } from '../../store/stopgroup.store';
import { TeacherStore } from '../../store/teacher.store';
import { LoginService } from '../../login.service';
import { StudentStore } from '../../store/student.store';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [FormsModule, RouterModule, NgClass, DeletePopupComponent],
  templateUrl: './stop-details.component.html',
})
export class StopDetailsComponent implements OnInit {
  private stopStore = inject(StopStore);
  protected divisionStore = inject(DivisionStore);
  protected stopGroupStore = inject(StopGroupStore);
  protected teacherStore = inject(TeacherStore);
  protected studentStore = inject(StudentStore);
  loginService = inject(LoginService);
  private service: StopService = inject(StopService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);

  constructor(private router: Router) {
  }

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

  inactiveDivisions = computed(() => this.divisionStore.divisions().filter((d) => !this.stop()?.divisionIds.includes(d.id)));

  errorMessage = signal<string | null>(null);

  // Popup signals and properties
  showRemoveDivisionPopup = signal<boolean>(false);
  showRemoveTeacherPopup = signal<boolean>(false);
  showRemoveStudentPopup = signal<boolean>(false);
  divisionIdToRemove: string = '';
  teacherUsernameToRemove: string = '';
  studentUsernameToRemove: string = '';

  // Section expansion states
  expandedSections = signal<{[key: string]: boolean}>({
    info: true,
    students: false,
    teachers: false,
    stopGroups: false,
    divisions: false
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

  teachersNotInStop = computed(() => {
    let filteredTeachers = this.teachersAvailableForAssignment();

    if (this.teacherFilterText().trim() !== '') {
      const searchText = this.teacherFilterText().toLowerCase().trim();
      filteredTeachers = filteredTeachers.filter(teacher =>
        teacher.firstName.toLowerCase().includes(searchText) ||
        teacher.lastName.toLowerCase().includes(searchText) ||
        teacher.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return filteredTeachers;
  });

  availableClasses = computed(() => {
    const classes = this.studentStore.students().map(student => student.studentClass);
    return ['all', ...new Set(classes)].filter(Boolean);
  });

  studentsNotInStop = computed(() => {
    const wrongStudents = this.studentStore.getStudentsByStopId(this.stop().id);
    let filteredStudents = this.studentStore.students().filter((student) => !wrongStudents.includes(student));

    if (this.selectedClass() !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.studentClass === this.selectedClass());
    }

    if (this.studentFilterText().trim() !== '') {
      const searchText = this.studentFilterText().toLowerCase().trim();
      filteredStudents = filteredStudents.filter(student =>
        student.firstName.toLowerCase().includes(searchText) ||
        student.lastName.toLowerCase().includes(searchText) ||
        student.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return filteredStudents;
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

      // Try to find the stop with a timeout to prevent infinite waiting
      const maxWaitTimeMs = 5000; // 5 seconds timeout
      const pollIntervalMs = 100;
      const maxAttempts = maxWaitTimeMs / pollIntervalMs;

      let attempts = 0;
      let foundStop: Stop | undefined;

      while (attempts < maxAttempts) {
        foundStop = this.stopStore.getStopById(Number(id));
        if (foundStop) {
          this.stop.set(foundStop);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        attempts++;
      }

      if (!foundStop) {
        this.errorMessage.set(`Could not find stop with ID ${id} after ${maxWaitTimeMs/1000} seconds`);
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
        console.log("teachers by stop -1");
        console.log(this.teacherStore.getTeachersByStopId(-1));
        this.teacherStore.setStopIdForAssignmentsOnNewStop(returnedStop.id);
        console.log("teachers by stop returned");
        console.log(this.teacherStore.getTeachersByStopId(returnedStop.id));
    } else {
      await this.stopStore.updateStop(this.stop());
    }

      this.studentStore.getStudentsByStopId(this.stop().id).forEach((student) => {
        this.studentStore.setAssignments(student.edufsUsername);
      });

      this.teacherStore.getTeachersByStopId(this.stop().id).forEach((teacher) => {
        console.log(teacher.firstName + ' ' + teacher.lastName);
        this.teacherStore.setAssignments(teacher.edufsUsername);
      });

    this.stop.set(this.emptyStop);
    await this.router.navigate(['/stops']);
  }

  async deleteAndGoBack() {
    await this.stopStore.deleteStop(this.stop().id);
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  goBack() {
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  async onDivisionSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const divisionId = parseInt(target.value);
    if (!this.stop().divisionIds.includes(divisionId) && this.divisionStore.divisions().find((d) => d.id === divisionId)) {
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
    const assignment = {
      studentId: edufsUsername,
      stopId: this.stop().id,
      status: Status.Pending,
    } as StudentAssignment;
    await this.studentStore.addStopToStudent(assignment);
    console.log(this.studentStore.getStudentsByStopId(this.stop().id));
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
    console.log(this.studentStore.getStudentsByStopId(this.stop().id));
    this.showRemoveStudentPopup.set(false);
  }

  // Keep for backward compatibility
  onDivisionRemove(divisionId: string) {
    this.selectDivisionToRemove(divisionId);
  }

  onTeacherRemove(edufsUsername: string) {
    this.selectTeacherToRemove(edufsUsername);
  }

  onStudentRemove(edufsUsername: string) {
    this.selectStudentToRemove(edufsUsername);
  }

  resetFilters() {
    this.selectedClass.set('all');
    this.studentFilterText.set('');
    this.teacherFilterText.set('');
  }

  async onTeacherClick(edufsUsername: string) {
    await this.teacherStore.addStopToTeacher(edufsUsername, this.stop().id);
  }
}
