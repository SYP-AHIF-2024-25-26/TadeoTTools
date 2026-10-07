import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { isValidString, plural } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { HasUnsavedChanges } from '@/core/guards/unsaved-changes.guard';
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
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

@Component({
  selector: 'app-stop-details',
  imports: [
    FormsModule,
    RouterModule,
    LoaderComponent,
    StopGeneralInfoComponent,
    StopStudentsComponent,
    StopManagersComponent,
    StopDivisionsComponent,
    DeletePopupComponent,
  ],
  templateUrl: './stop-details.component.html',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class StopDetailsComponent implements OnInit, HasUnsavedChanges {
  private divisionService = inject(DivisionService);
  private stopGroupService = inject(StopGroupService);
  private stopService = inject(StopService);
  private loginService = inject(LoginService);
  private stopManagerService = inject(StopManagerService);
  private studentService = inject(StudentService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);
  router = inject(Router);
  private scrollService = inject(ScrollPersistenceService);

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
    infrastructure: '',
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
        this.markSaved();
        return;
      }

      const foundStop = await this.stopService.getStopById(Number(id));
      if (foundStop === undefined) {
        this.errorMessage.set(`Could not find stop with ID ${id}`);
      } else {
        this.stop.set({ ...foundStop });
        this.markSaved();
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while loading data.');
    } finally {
      this.isLoading.set(false);
    }
    this.scrollService.restoreScroll();
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

  // Snapshot of the stop as loaded or last saved. Child sections edit the
  // stop's arrays in place, so changes are detected by comparing serialized state.
  private savedState: string | null = null;

  private markSaved() {
    this.savedState = JSON.stringify(this.stop());
  }

  hasUnsavedChanges(): boolean {
    return (
      this.savedState !== null &&
      JSON.stringify(this.stop()) !== this.savedState
    );
  }

  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  saving = signal<boolean>(false);

  async submitStopDetail() {
    if (this.saving() || !this.hasUnsavedChanges() || !this.isInputValid()) {
      return;
    }
    this.errorMessage.set(null);
    this.saving.set(true);

    try {
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
    } catch (error) {
      console.error('Failed to save stop', error);
      this.errorMessage.set(
        'The stop could not be saved. Your changes are still here, please try again.'
      );
      this.saving.set(false);
      return;
    }
    this.saving.set(false);
    this.markSaved();
    this.location.back();
  }

  showDeleteConfirm = signal<boolean>(false);
  deleting = signal<boolean>(false);

  deleteMessage = computed(() => {
    const stop = this.stop();
    return (
      `"${stop.name}" will be permanently deleted.\n` +
      `It is in ${plural(stop.stopGroupIds?.length ?? 0, 'stop group')} ` +
      `and has ${plural(stop.studentAssignments?.length ?? 0, 'student assignment')} ` +
      `and ${plural(stop.stopManagerAssignments?.length ?? 0, 'stop manager')}.`
    );
  });

  async deleteAndGoBack() {
    if (!this.isAdmin()) {
      return;
    }
    this.deleting.set(true);
    try {
      await this.stopService.deleteStop(this.stop().id);
      this.markSaved();
      this.location.back();
    } catch (error) {
      console.error('Failed to delete stop', error);
      this.errorMessage.set('The stop could not be deleted. Please try again.');
      this.showDeleteConfirm.set(false);
    } finally {
      this.deleting.set(false);
    }
  }

  // Cancel is an explicit "discard my changes", so it skips the unsaved-changes prompt.
  goBack() {
    this.markSaved();
    this.location.back();
  }
}
