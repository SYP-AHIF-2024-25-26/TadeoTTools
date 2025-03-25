import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {StopService} from '../../stop.service';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Stop, StopGroup, Teacher} from '../../types';
import {isValid} from '../../utilfunctions';
import {firstValueFrom} from 'rxjs';
import {ChipComponent} from '../../standard-components/chip/chip.component';
import {Location} from '@angular/common';
import {StopStore} from "../../store/stop.store";
import {DivisionStore} from "../../store/division.store";
import {StopGroupStore} from "../../store/stopgroup.store";
import {TeacherStore} from "../../store/teacher.store";
import {TeacherService} from "../../teacher.service";

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

  teachers = signal<Teacher[]>([]);

  inactiveDivisions = computed(() =>
    this.divisionStore.divisions().filter((d) => !this.stop()?.divisionIds.includes(d.id))
  );

  errorMessage = signal<string | null>(null);

  teachersByStopId = computed(() => {
    return this.teachers().filter((teacher) => {
      if (teacher.assignments) {
        return teacher.assignments.some((assignment) => assignment.stopId === this.stop().id);
      }
      return false;
    });
  });

  teachersNotInStop = computed(() => {
    const wrongTeachers = this.teachers().filter((teacher) => {
      if (teacher.assignments) {
        return teacher.assignments.some((assignment) => assignment.stopId === this.stop().id);
      }
      return false;
    });
    return this.teachers().filter((teacher) => !wrongTeachers.includes(teacher));
  });

  async ngOnInit() {
    this.teachers.set(await this.teacherService.getTeachers());
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
      await this.teacherService.unassignAllFromStop(this.stop().id);
      this.teachersByStopId().forEach((teacher) => {
        console.log(teacher.edufsUsername)
        this.teacherService.assignStopToTeacher(teacher.edufsUsername, this.stop().id);
      });
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

  onDivisionRemove(divisionId: string) {
    this.stop.update((stop) => {
      stop.divisionIds = stop.divisionIds.filter((ids) => ids !== Number.parseInt(divisionId));
      return stop;
    });
  }

  onTeacherRemove(edufsUsername: string) {
    this.teacherStore.removeStopFromTeacher(edufsUsername, this.stop().id);
    this.teachers.set(this.teacherStore.getTeachers());
  }

  onTeacherSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const edufsUsername = target.value;
    this.teacherStore.addStopToTeacher(edufsUsername, this.stop().id)
    this.teachers.set(this.teacherStore.getTeachers());
  }
}
