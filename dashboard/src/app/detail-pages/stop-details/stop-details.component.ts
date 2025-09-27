import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StopService } from '../../stop.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Division, Status, Stop, StopGroup, Student, StudentAssignment, Teacher } from '../../types';
import { isValid } from '../../utilfunctions';
import { firstValueFrom } from 'rxjs';
import { Location, NgClass } from '@angular/common';
import { LoginService } from '../../login.service';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import { sortStudents } from '../../utilfunctions';
import { DivisionService } from '../../division.service';
import { StopGroupService } from '../../stopgroup.service';
import { TeacherService } from '../../teacher.service';
import { StudentService } from '../../student.service';

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
  private teacherService = inject(TeacherService);
  private studentService = inject(StudentService);

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  teachers = signal<Teacher[]>([]);
  students = signal<Student[]>([]);

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
    orders: [],
    studentAssignments: [],
    teacherAssignments: [],
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
  divisionIdToRemove: string = '';

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
    return this.stop().teacherAssignments
      ? this.stop().teacherAssignments
          .map(a => this.teachers().find(t => t.edufsUsername === a.teacherId))
          .filter((t): t is Teacher => t !== undefined)
      : [];
  });

  teachersAvailableForAssignment = computed(() => {
    const assignedTeachers = this.teachersAssignedToStop();
    return this.teachers().filter((teacher) => !assignedTeachers.includes(teacher));
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
    const classes = this.students().map(student => student.studentClass).sort();
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
    const assignedStudents = this.stop().studentAssignments
      ? this.stop().studentAssignments
          .map(a => {
            const student = this.students().find(s => s.edufsUsername === a.edufsUsername);
            if (student) {
              return {
                ...student,
                assignmentStatus: a.status
              };
            }
            return undefined;
          })
          .filter((s): s is Student & { assignmentStatus: Status } => s !== undefined)
      : [];
    return sortStudents(this.applyStudentFilters(assignedStudents, this.assignedStudentFilterText(), this.selectedAssignedClass()));
  });

  studentsNotInStop = computed(() => {
    const wrongStudents = this.stop().studentAssignments
      ? this.stop().studentAssignments
          .map(a => this.students().find(s => s.edufsUsername === a.edufsUsername))
          .filter((s): s is Student => s !== undefined)
      : [];
    let filteredStudents = this.students().filter((student) => !wrongStudents.includes(student));
    return sortStudents(this.applyStudentFilters(filteredStudents, this.availableStudentFilterText(), this.selectedAvailableClass()));
  });

  async ngOnInit() {
    try {
      const response = await this.loginService.performCall('is-admin');
      this.isAdmin.set(response.includes('admin'));
    } catch (error) {
    }

    // Get stop ID from route parameters
    const params = await firstValueFrom(this.route.queryParams);
    const id = params['id'] || -1;

    this.stopGroups.set(await this.stopGroupService.getStopGroups());
    this.divisions.set(await this.divisionService.getDivisions());
    this.students.set(await this.studentService.getStudents());
    this.teachers.set((await this.teacherService.getTeachers()).sort((a, b) => a.lastName.localeCompare(b.lastName)));

    if (id === -1) {
      this.stop.set({ ...this.emptyStop });
      return;
    } 

    let foundStop: Stop | undefined;

    foundStop = await this.stopService.getStopById(Number(id));
    if (foundStop === undefined) {
      this.errorMessage.set(`Could not find stop with ID ${id}`);
    } else {
      this.stop.set({ ...foundStop });
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
      const returnedStop = await this.service.addStop(this.stop());
      this.stop.set({ ...this.stop(), id: returnedStop.id });
      this.teacherService.setStopIdForAssignmentsOnNewStop(returnedStop.id);
    } else {
      if (this.isAdmin()) {
        await this.stopService.updateStop(this.stop());
      } else {
        await this.stopService.updateStopAsTeacher(this.stop());
      }
    }

    this.location.back();
  }

  async deleteAndGoBack() {
    await this.stopService.deleteStop(this.stop().id);
    this.location.back();
  }

  goBack() {
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
    this.stop.update((stop) => ({
      ...stop,
      studentAssignments: [
        ...(stop.studentAssignments || []),
        { edufsUsername, status: Status.Pending }
      ]
    }));
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

  removeTeacher(edufsUsername: string) {
    this.stop.update((stop) => {
      stop.teacherAssignments = stop.teacherAssignments.filter(a => a.teacherId !== edufsUsername);
      return stop;
    });
  }
  // Keep for backward compatibility
  onDivisionRemove(divisionId: string) {
    this.selectDivisionToRemove(divisionId);
  }

  removeStudent(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      studentAssignments: (stop.studentAssignments || []).filter(
        a => a.edufsUsername !== edufsUsername
      )
    }));
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
    const assignment = this.stop().studentAssignments?.find(a => a.edufsUsername === student.edufsUsername);
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

  addTeacher(edufsUsername: string) {
    this.stop.update((stop) => {
      if (!stop.teacherAssignments) {
        stop.teacherAssignments = [];
      }
      stop.teacherAssignments.push({teacherId: edufsUsername, stopId: this.stop().id});
      return stop;
    });
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