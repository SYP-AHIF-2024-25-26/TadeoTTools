import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {StopService} from '../../stop.service';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Status, Stop, StudentAssignment} from '../../types';
import {isValid} from '../../utilfunctions';
import {firstValueFrom} from 'rxjs';
import {ChipComponent} from '../../standard-components/chip/chip.component';
import {Location} from '@angular/common';
import {StopStore} from "../../store/stop.store";
import {DivisionStore} from "../../store/division.store";
import {StopGroupStore} from "../../store/stopgroup.store";
import {TeacherStore} from "../../store/teacher.store";
import {TeacherService} from "../../teacher.service";
import {LoginService} from "../../login.service";
import {StudentStore} from "../../store/student.store";

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [FormsModule, RouterModule, ChipComponent],
  templateUrl: './stop-details.component.html',
  styleUrl: './stop-details.component.css'
})
export class StopDetailsComponent implements OnInit {
  private stopStore = inject(StopStore);
  protected divisionStore = inject(DivisionStore);
  protected stopGroupStore = inject(StopGroupStore);
  protected teacherStore = inject(TeacherStore);
  protected studentStore = inject(StudentStore);
  loginService = inject(LoginService);
  teacherService = inject(TeacherService);
  private service: StopService = inject(StopService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);

  emptyStop = {
    id: -1,
    name: '',
    description: '',
    roomNr: '',
    divisionIds: [],
    stopGroupIds: [],
    teachers: [],
    orders: []
  };
  stop = signal<Stop>(this.emptyStop);
  isAdmin = signal(false);

  inactiveDivisions = computed(() =>
    this.divisionStore.divisions().filter((d) => !this.stop()?.divisionIds.includes(d.id))
  );

  errorMessage = signal<string | null>(null);

  teachersByStopId = computed(() => {
    return this.teacherStore.teachers().filter((teacher) =>
      teacher.stopAssignments.some((assignment) => assignment == this.stop().id)
    )
  });



  teachersNotInStop = computed(() => {
    const wrongTeachers = this.teachersByStopId();
    return this.teacherStore.teachers().filter((teacher) => !wrongTeachers.includes(teacher));
  });

  studentsNotInStop = computed(() => {
    const wrongStudents = this.studentsByStopId();
    return this.studentStore.students().filter((student) => !wrongStudents.includes(student));
  });

  async ngOnInit() {
    const response = await this.loginService.performCall('is-admin');
    this.isAdmin.set(response.includes('admin'));
    const params = await firstValueFrom(this.route.queryParams);
    const id = params['id'] || -1;
    const maybeStop = this.stopStore.stops().find(s => s.id == id);
    if (maybeStop) {
      this.stop.set(maybeStop)
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
      await this.service.addStop(this.stop());
    } else {
      await this.stopStore.updateStop(this.stop());
    }

    this.stop.set(this.emptyStop);
    this.location.back();
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
    if (
      !this.stop().divisionIds.includes(divisionId) &&
      this.divisionStore.divisions().find((d) => d.id === divisionId)
    ) {
      this.stop.update((stop) => {
        stop.divisionIds = [divisionId, ...stop.divisionIds];
        return stop;
      });
    }
  }

  async onStudentSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const edufsUsername = target.value;
    const assignment = {
      studentId: edufsUsername,
      stopId: this.stop().id,
      status: Status.Pending
    } as StudentAssignment;
    await this.studentStore.addStopToStudent(assignment);
  }

  async onTeacherSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const edufsUsername = target.value;
    await this.teacherStore.addStopToTeacher(edufsUsername, this.stop().id);
  }

  onDivisionRemove(divisionId: string) {
    this.stop.update((stop) => {
      stop.divisionIds = stop.divisionIds.filter((ids) => ids !== Number.parseInt(divisionId));
      return stop;
    });
  }

  onTeacherRemove(edufsUsername: string) {
    this.teacherStore.removeStopFromTeacher(edufsUsername, this.stop().id);
  }

  onStudentRemove(edufsUsername: string) {
    this.studentStore.removeStopFromStudent(edufsUsername, this.stop().id);
  }

}
