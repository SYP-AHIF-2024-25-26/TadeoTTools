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
    teachers: [],
    orders: [],
    studentAssignments: [],
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
    return this.teachers().filter((teacher) =>
      teacher.assignedStops.some((assignment) => assignment == this.stop().id)
    );
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
    const assignedStudents = this.students().filter(s => s.studentAssignments.some(a => a.stopId === this.stop().id));
    return sortStudents(this.applyStudentFilters(assignedStudents, this.assignedStudentFilterText(), this.selectedAssignedClass()));
  });

  studentsNotInStop = computed(() => {
    const wrongStudents = this.students().filter(s => s.studentAssignments.some(a => a.stopId === this.stop().id));
    let filteredStudents = this.students().filter((student) => !wrongStudents.includes(student));
    return sortStudents(this.applyStudentFilters(filteredStudents, this.availableStudentFilterText(), this.selectedAvailableClass()));
  });

  async ngOnInit() {
      try {
        const response = await this.loginService.performCall('is-admin');
        this.isAdmin.set(response.includes('admin'));
      } catch (error) {
        console.error('Not an admin');
      }

      // Get stop ID from route parameters
      const params = await firstValueFrom(this.route.queryParams);
      const id = params['id'] || -1;

      // If this is a new stop (id = -1), no need to fetch existing stop
      if (id === -1) {
        return;
      }

      this.stopGroups.set(await this.stopGroupService.getStopGroups());
      this.divisions.set(await this.divisionService.getDivisions());
      this.students.set(await this.studentService.getStudents());
      this.teachers.set((await this.teacherService.getTeachers()).sort((a, b) => a.lastName.localeCompare(b.lastName)));

      let foundStop: Stop | undefined;

      foundStop = await this.stopService.getStopById(Number(id));
      if (foundStop === undefined) {
        this.errorMessage.set(`Could not find stop with ID ${id}`);
      } else {
        this.stop.set({ ...foundStop });
        const students = this.students().filter(s => s.studentAssignments.some(a => a.stopId === foundStop!.id));
        students.forEach(s => {
          const assignments = s.studentAssignments
            .filter(a => a.stopId === foundStop!.id)
            .map(a => ({ ...a }));
          this.originalAssignments.set(s.edufsUsername, assignments);
        });
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
      await this.stopService.updateStop(this.stop());
    }/*
    this.students().forEach((student) => {
      this.studentService.setAssignments(student.edufsUsername, student.studentAssignments);
    });*/

    this.teachers().forEach((teacher) => {
      this.teacherService.setAssignments(teacher.edufsUsername, teacher.assignedStops);
    });

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
    this.stop.update((stop) => {
      stop.studentAssignments.push({studentId: edufsUsername, status: Status.Pending})
      return stop;
    });
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
    this.teachers.update(teachers => {
      const teacher = teachers.find(t => t.edufsUsername === edufsUsername);
      if (teacher) {
        teacher.assignedStops = teacher.assignedStops.filter(stopId => stopId !== this.stop().id);
      }
      return [...teachers];
    });
  }
  // Keep for backward compatibility
  onDivisionRemove(divisionId: string) {
    this.selectDivisionToRemove(divisionId);
  }

  removeStudent(edufsUsername: string) {
    this.stop.update((stop) => {
      stop.studentAssignments = stop.studentAssignments.filter(a => a.studentId !== edufsUsername);
      return stop;
    });
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

  addTeacher(edufsUsername: string) {
    this.teachers.update(teachers => {
      const teacher = teachers.find(t => t.edufsUsername === edufsUsername);
      if (teacher && !teacher.assignedStops.includes(this.stop().id)) {
        teacher.assignedStops.push(this.stop().id);
      }
      return [...teachers];
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