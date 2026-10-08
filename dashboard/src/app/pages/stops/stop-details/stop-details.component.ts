import {
  afterNextRender,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
  signal,
} from '@angular/core';
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
import { plural } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { HasUnsavedChanges } from '@/core/guards/unsaved-changes.guard';
import { firstValueFrom } from 'rxjs';
import { Location } from '@angular/common';
import { LoginService } from '@/core/services/auth.service';
import { DivisionService } from '@/core/services/division.service';
import { StopGroupService } from '@/core/services/stopgroup.service';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { StudentService } from '@/core/services/student.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { LoaderComponent } from '@/shared/components/loading-spinner/loading-spinner.component';
import {
  StopGeneralInfoComponent,
  stopFieldErrors,
} from './components/stop-general-info/stop-general-info.component';
import { StopStudentsComponent } from './components/stop-students/stop-students.component';
import { StopManagersComponent } from './components/stop-managers/stop-managers.component';
import { StopHeaderComponent } from './components/stop-header/stop-header.component';
import { StopDivisionPickerComponent } from './components/stop-division-picker/stop-division-picker.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

const FIELD_ERRORS = 'Some fields need attention, see the messages above.';

@Component({
  selector: 'app-stop-details',
  imports: [
    FormsModule,
    RouterModule,
    LoaderComponent,
    StopGeneralInfoComponent,
    StopStudentsComponent,
    StopManagersComponent,
    StopHeaderComponent,
    StopDivisionPickerComponent,
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
  private toast = inject(ToastService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);
  private injector = inject(Injector);
  router = inject(Router);
  private scrollService = inject(ScrollPersistenceService);

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  stopManagers = signal<StopManager[]>([]);
  students = signal<Student[]>([]);

  isLoading = signal<boolean>(true);
  notFound = signal<boolean>(false);

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

  isNew = computed(() => this.stop().id === -1);

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
        this.notFound.set(true);
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

  // Field errors show from the first save attempt on and then update live.
  showFieldErrors = signal<boolean>(false);

  isInputValid() {
    if (stopFieldErrors(this.stop())) {
      this.showFieldErrors.set(true);
      this.errorMessage.set(FIELD_ERRORS);
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

  /** Unsaved changes of the page itself (students, stop managers). */
  hasPageChanges(): boolean {
    return (
      this.savedState !== null &&
      JSON.stringify(this.stop()) !== this.savedState
    );
  }

  hasUnsavedChanges(): boolean {
    return this.hasPageChanges() || this.hasDetailChanges();
  }

  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  // ---- Stop details (name, room, description, infrastructure, divisions) ----
  // Edited in their own section with their own save, so the page can open on
  // the students. The draft is a copy; the page's stop only changes on save.

  detailsDraft = signal<Stop | null>(null);
  showDetailErrors = signal<boolean>(false);
  detailsError = signal<string | null>(null);
  savingDetails = signal<boolean>(false);

  editDetails() {
    const stop = this.stop();
    this.detailsDraft.set({ ...stop, divisionIds: [...stop.divisionIds] });
    this.showDetailErrors.set(false);
    this.detailsError.set(null);
    afterNextRender(() => document.getElementById('name')?.focus(), {
      injector: this.injector,
    });
  }

  private closeDetails() {
    this.detailsDraft.set(null);
    afterNextRender(
      () => document.getElementById('edit-stop-details')?.focus(),
      { injector: this.injector }
    );
  }

  cancelDetails() {
    this.closeDetails();
  }

  hasDetailChanges(): boolean {
    const draft = this.detailsDraft();
    if (draft === null) return false;
    const stop = this.stop();
    return (
      draft.name !== stop.name ||
      draft.description !== stop.description ||
      draft.roomNr !== stop.roomNr ||
      (draft.infrastructure ?? '') !== (stop.infrastructure ?? '') ||
      JSON.stringify(draft.divisionIds) !== JSON.stringify(stop.divisionIds)
    );
  }

  setDraftDivisions(divisionIds: number[]) {
    this.detailsDraft.update((draft) => draft && { ...draft, divisionIds });
  }

  async saveDetails() {
    const draft = this.detailsDraft();
    if (draft === null || this.savingDetails() || !this.hasDetailChanges()) {
      return;
    }
    if (stopFieldErrors(draft)) {
      this.showDetailErrors.set(true);
      this.detailsError.set(FIELD_ERRORS);
      return;
    }
    this.detailsError.set(null);
    this.savingDetails.set(true);

    // Send the details with the last saved students and managers, so unsaved
    // student changes stay a draft instead of being saved along with them.
    const saved = JSON.parse(this.savedState!) as Stop;
    const details = {
      name: draft.name,
      description: draft.description,
      roomNr: draft.roomNr,
      infrastructure: draft.infrastructure,
      divisionIds: this.isAdmin() ? draft.divisionIds : saved.divisionIds,
    };
    const payload: Stop = { ...saved, ...details };

    try {
      if (this.isAdmin()) {
        await this.stopService.updateStop(payload);
      } else {
        await this.stopService.updateStopAsStopManager(payload);
      }
    } catch (error) {
      console.error('Failed to save stop details', error);
      this.detailsError.set(
        errorText(
          error,
          'The stop details could not be saved. Your changes are still here, please try again.'
        )
      );
      return;
    } finally {
      this.savingDetails.set(false);
    }

    this.stop.update((stop) => ({ ...stop, ...details }));
    this.savedState = JSON.stringify(payload);
    this.closeDetails();
    this.toast.success('Stop details saved.');
  }

  setNewStopDivisions(divisionIds: number[]) {
    this.stop.update((stop) => ({ ...stop, divisionIds }));
  }

  // ---- Page save (new stop: everything; existing stop: students, managers) ----

  saving = signal<boolean>(false);

  async submitStopDetail() {
    if (this.saving() || !this.hasPageChanges() || !this.isInputValid()) {
      return;
    }
    this.errorMessage.set(null);
    this.saving.set(true);

    const isNew = this.isNew();
    try {
      if (isNew) {
        const returnedStop = await this.stopService.addStop(this.stop());
        this.stop.set({ ...this.stop(), id: returnedStop.id });
      } else if (this.isAdmin()) {
        await this.stopService.updateStop(this.stop());
      } else {
        await this.stopService.updateStopAsStopManager(this.stop());
      }
    } catch (error) {
      console.error('Failed to save stop', error);
      this.errorMessage.set(
        errorText(
          error,
          'The stop could not be saved. Your changes are still here, please try again.'
        )
      );
      this.saving.set(false);
      return;
    }
    this.saving.set(false);
    this.markSaved();
    if (isNew) {
      this.location.back();
    } else {
      // Stay on the page: students are usually handled several in a row.
      this.toast.success('Changes saved.');
    }
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
      this.detailsDraft.set(null);
      this.location.back();
    } catch (error) {
      console.error('Failed to delete stop', error);
      this.errorMessage.set('The stop could not be deleted. Please try again.');
      this.showDeleteConfirm.set(false);
    } finally {
      this.deleting.set(false);
    }
  }

  // Cancel (new stop) is an explicit "discard", so it skips the unsaved-changes
  // prompt. Back (existing stop) goes through the guard instead.
  goBack(discard: boolean) {
    if (discard) {
      this.markSaved();
      this.detailsDraft.set(null);
    }
    this.location.back();
  }
}
