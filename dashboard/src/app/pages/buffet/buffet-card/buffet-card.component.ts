import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { BuffetService } from '@/core/services/buffet.service';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { ActionIconComponent } from '@/shared/components/action-icon/action-icon.component';
import { Buffet, BuffetProduct } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { euro } from '../money';

@Component({
  selector: 'app-buffet-card',
  templateUrl: './buffet-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DragDropModule, ActionIconComponent],
})
export class BuffetCardComponent {
  private buffetService = inject(BuffetService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  buffet = input.required<Buffet>();
  products = input.required<BuffetProduct[]>();
  changed = output<void>();

  protected readonly euro = euro;

  protected details = new FormGroup({
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
  });
  private detailsValue = toSignal(this.details.valueChanges, {
    initialValue: this.details.getRawValue(),
  });

  // The menu as edited; saved together with the details.
  protected menu = signal<number[]>([]);
  protected saving = signal(false);
  protected saveError = signal('');

  constructor() {
    // A reload from the server (after a save here or elsewhere on the page) takes the
    // new values, but keeps edits that are not saved yet.
    effect(() => {
      const buffet = this.buffet();
      untracked(() => {
        if (!this.loaded || !this.detailsChangedFrom(this.loaded)) {
          this.details.reset({
            location: buffet.location,
            description: buffet.description,
          });
        }
        if (!this.loaded || sameMenu(this.loaded.menu, this.menu())) {
          this.menu.set([...buffet.menu]);
        }
        this.loaded = buffet;
      });
    });
  }

  private productMap = computed(
    () => new Map(this.products().map((p) => [p.id, p]))
  );

  protected onMenu = computed(() =>
    this.menu()
      .map((id) => this.productMap().get(id))
      .filter((p): p is BuffetProduct => p !== undefined)
  );

  protected notOnMenu = computed(() => {
    const menu = new Set(this.menu());
    return this.products().filter((p) => !menu.has(p.id));
  });

  // The buffet the edits started from.
  private loaded: Buffet | undefined;

  private menuChanged = computed(
    () => !sameMenu(this.buffet().menu, this.menu())
  );

  private detailsChanged = computed(() => {
    this.detailsValue();
    return this.detailsChangedFrom(this.buffet());
  });

  private detailsChangedFrom(buffet: Buffet): boolean {
    const { location, description } = this.details.getRawValue();
    return (
      location.trim() !== buffet.location ||
      description.trim() !== buffet.description
    );
  }

  protected dirty = computed(() => this.menuChanged() || this.detailsChanged());

  protected addToMenu(product: BuffetProduct): void {
    this.menu.update((menu) => [...menu, product.id]);
  }

  protected removeFromMenu(product: BuffetProduct): void {
    this.menu.update((menu) => menu.filter((id) => id !== product.id));
  }

  protected drop(event: CdkDragDrop<unknown>): void {
    this.move(event.previousIndex, event.currentIndex);
  }

  // Keyboard alternative to dragging.
  protected move(from: number, to: number): void {
    this.menu.update((menu) => {
      const next = [...menu];
      moveItemInArray(next, from, to);
      return next;
    });
  }

  protected discard(): void {
    const buffet = this.buffet();
    this.details.reset({
      location: buffet.location,
      description: buffet.description,
    });
    this.menu.set([...buffet.menu]);
    this.saveError.set('');
  }

  protected async save(): Promise<void> {
    if (this.details.invalid || this.saving()) {
      this.details.markAllAsTouched();
      return;
    }
    const buffet = this.buffet();
    this.saving.set(true);
    this.saveError.set('');
    try {
      if (this.detailsChanged()) {
        const { location, description } = this.details.getRawValue();
        await this.buffetService.updateBuffet(buffet.id, {
          location: location.trim(),
          description: description.trim(),
        });
      }
      if (this.menuChanged()) {
        await this.buffetService.updateMenu(buffet.id, this.menu());
      }
      this.changed.emit();
    } catch (error) {
      this.saveError.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? `Another buffet already has the location "${this.details.getRawValue().location.trim()}".`
          : errorText(error, 'The buffet could not be saved.')
      );
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(): Promise<void> {
    const buffet = this.buffet();
    if (buffet.orderCount > 0 || buffet.cashMovements.length > 0) {
      const parts = [
        buffet.orderCount > 0 ? plural(buffet.orderCount, 'sale') : '',
        buffet.cashMovements.length > 0
          ? plural(buffet.cashMovements.length, 'cash movement')
          : '',
      ].filter((p) => p !== '');
      this.toast.error(
        `${buffet.location} has ${parts.join(' and ')}, so it can't be deleted. Empty its menu instead to hide it from the cashier; cash movements are on the Sales tab.`
      );
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Buffet',
      message: `${buffet.location} and its menu are deleted. The products stay.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.buffetService.deleteBuffet(buffet.id);
      this.changed.emit();
    } catch (error) {
      this.toast.error(
        errorText(error, `${buffet.location} could not be deleted.`)
      );
    }
  }
}

function sameMenu(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}
