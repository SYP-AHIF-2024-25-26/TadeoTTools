import { Component, inject, OnInit, signal } from '@angular/core';
import { StopService } from '@/core/services/stop.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Division,
  Stop,
  StopGroup,
  Student,
  StopManager,
} from '@/shared/models/types';
import { isValidString } from '@/shared/utils/utils';
import { firstValueFrom } from 'rxjs';
import { Location } from '@angular/common';
import { LoginService } from '@/core/services/auth.service';
import { DivisionService } from '@/core/services/division.service';
import { StopGroupService } from '@/core/services/stopgroup.service';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { StudentService } from '@/core/services/student.service';
import { LoaderComponent } from '@/shared/components/loading-spinner/loading-spinner.component';
import { StopGeneralInfoComponent } from './components/stop-general-info/stop-general-info.component';
import { StopGroupsComponent } from './components/stop-groups/stop-groups.component';
import { StopStudentsComponent } from './components/stop-students/stop-students.component';
import { StopManagersComponent } from './components/stop-managers/stop-managers.component';
import { StopDivisionsComponent } from './components/stop-divisions/stop-divisions.component';

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    LoaderComponent,
    StopGeneralInfoComponent,
    StopGroupsComponent,
    StopStudentsComponent,
    StopManagersComponent,
    StopDivisionsComponent,
  ],
  templateUrl: './stop-details.component.html',
})
export class StopDetailsComponent implements OnInit {
  private divisionService = inject(DivisionService);
  private stopGroupService = inject(StopGroupService);
  private stopService = inject(StopService);
  private loginService = inject(LoginService);
  private stopManagerService = inject(StopManagerService);
  private studentService = inject(StudentService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);
  router = inject(Router);

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  stopManagers = signal<StopManager[]>([]);
  students = signal<Student[]>([]);

  isLoading = signal<boolean>(true);

  emptyStop = {
    id: -1,
    name: '',
    description: '',
    roomNr: '',
    divisionIds: [],
    stopGroupIds: [],
    orders: [],
    studentAssignments: [],
    stopManagerAssignments: [],
  };

  stop = signal<Stop>(this.emptyStop);
  isAdmin = signal(false);
  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    this.isLoading.set(true);
    try {
      const response = await this.loginService.checkUserRole(
        'in-database',
        'admin'
      );
      this.isAdmin.set(response);

      const params = await firstValueFrom(this.route.queryParams);
      const id = params['id'] || -1;

      this.stopGroups.set(await this.stopGroupService.getStopGroups());
      this.divisions.set(await this.divisionService.getDivisions());
      this.students.set(await this.studentService.getStudents());
      this.stopManagers.set(
        (await this.stopManagerService.getStopManagers()).sort((a, b) =>
          a.lastName.localeCompare(b.lastName)
        )
      );

      if (id === -1) {
        this.stop.set({ ...this.emptyStop });
        return;
      }

      const foundStop = await this.stopService.getStopById(Number(id));
      if (foundStop === undefined) {
        this.errorMessage.set(`Could not find stop with ID ${id}`);
      } else {
        this.stop.set({ ...foundStop });
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while loading data.');
    } finally {
      this.isLoading.set(false);
    }
  }

  isInputValid() {
    if (!isValidString(this.stop().name, 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValidString(this.stop().description, 255)) {
      this.errorMessage.set('Description must be between 1 and 255 characters');
      return false;
    }
    if (!isValidString(this.stop().roomNr, 50)) {
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
      const returnedStop = await this.stopService.addStop(this.stop());
      this.stop.set({ ...this.stop(), id: returnedStop.id });
    } else {
      if (this.isAdmin()) {
        await this.stopService.updateStop(this.stop());
      } else {
        await this.stopService.updateStopAsStopManager(this.stop());
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
}
