import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BuffetService } from '@/core/services/buffet.service';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { ActionIconComponent } from '@/shared/components/action-icon/action-icon.component';
import { BuffetProduct, SaveBuffetProductRequest } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { euro, euroInput, parseEuro } from '../money';

function euroValidator(control: AbstractControl): ValidationErrors | null {
  return parseEuro(String(control.value ?? '')) === null
    ? { euro: true }
    : null;
}

function productForm() {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(40)],
    }),
    unit: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    price: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, euroValidator],
    }),
  });
}

type ProductForm = ReturnType<typeof productForm>;

@Component({
  selector: 'app-buffet-products',
  templateUrl: './buffet-products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ActionIconComponent],
})
export class BuffetProductsComponent {
  private buffetService = inject(BuffetService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  products = input.required<BuffetProduct[]>();
  changed = output<void>();

  protected readonly euro = euro;

  protected addForm = productForm();
  protected adding = signal(false);
  protected addError = signal('');

  protected editingId = signal<number | null>(null);
  protected editForm = productForm();
  protected saving = signal(false);
  protected editError = signal('');

  private addName = viewChild<ElementRef<HTMLInputElement>>('addName');

  // Called by the page when the list is empty, so the first product can be typed at once.
  focusAdd(): void {
    this.addName()?.nativeElement.focus();
  }

  protected edit(product: BuffetProduct): void {
    this.editForm.setValue({
      name: product.name,
      unit: product.unit,
      price: euroInput(product.priceCents),
    });
    this.editError.set('');
    this.editingId.set(product.id);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
  }

  protected async add(): Promise<void> {
    if (this.addForm.invalid || this.adding()) {
      this.addForm.markAllAsTouched();
      return;
    }
    this.adding.set(true);
    this.addError.set('');
    try {
      await this.buffetService.addProduct(request(this.addForm));
      this.addForm.reset();
      this.changed.emit();
      this.focusAdd();
    } catch (error) {
      this.addError.set(saveErrorText(error, this.addForm));
    } finally {
      this.adding.set(false);
    }
  }

  protected async save(product: BuffetProduct): Promise<void> {
    if (this.editForm.invalid || this.saving()) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.editError.set('');
    try {
      await this.buffetService.updateProduct(
        product.id,
        request(this.editForm)
      );
      this.editingId.set(null);
      this.changed.emit();
    } catch (error) {
      this.editError.set(saveErrorText(error, this.editForm));
    } finally {
      this.saving.set(false);
    }
  }

  protected async remove(product: BuffetProduct): Promise<void> {
    // The backend refuses these too; saying why up front spares a dialog that cannot succeed.
    if (product.menuCount > 0) {
      this.toast.error(
        `${product.name} is on ${plural(product.menuCount, 'menu')}. Take it off the menu first.`
      );
      return;
    }
    if (product.soldCount > 0) {
      this.toast.error(
        `${product.name} has been sold ${product.soldCount} times. It can be deleted after "Delete all sales".`
      );
      return;
    }
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Product',
      message: `${product.name} is deleted. It is on no menu and has no sales.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.buffetService.deleteProduct(product.id);
      this.changed.emit();
    } catch (error) {
      this.toast.error(
        errorText(error, `${product.name} could not be deleted.`)
      );
    }
  }
}

function request(form: ProductForm): SaveBuffetProductRequest {
  const { name, unit, price } = form.getRawValue();
  return {
    name: name.trim(),
    unit: unit.trim(),
    priceCents: parseEuro(price)!,
  };
}

function saveErrorText(error: unknown, form: ProductForm): string {
  if (error instanceof HttpErrorResponse && error.status === 409) {
    return `A product named "${form.getRawValue().name.trim()}" already exists.`;
  }
  return errorText(error, 'The product could not be saved.');
}
