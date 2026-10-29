import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BuffetService } from '@/core/services/buffet.service';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { ActionIconComponent } from '@/shared/components/action-icon/action-icon.component';
import { Buffet, BuffetSales, CashMovement } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { euro, parseEuro } from '../money';

// One buffet's money: revenue per product, deposits and withdrawals, and what the
// till should hold at the end (all sales are paid in cash).
@Component({
  selector: 'app-buffet-till',
  templateUrl: './buffet-till.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, ActionIconComponent],
})
export class BuffetTillComponent {
  private buffetService = inject(BuffetService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  buffet = input.required<Buffet>();
  sales = input<BuffetSales | undefined>(undefined);
  changed = output<void>();

  protected readonly euro = euro;
  protected readonly plural = plural;

  protected revenue = computed(() => this.sales()?.revenueCents ?? 0);
  protected cashTotal = computed(() =>
    this.buffet().cashMovements.reduce((sum, m) => sum + m.amountCents, 0)
  );
  protected expected = computed(() => this.cashTotal() + this.revenue());

  protected cashForm = new FormGroup({
    direction: new FormControl<'in' | 'out'>('in', { nonNullable: true }),
    amount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  protected addingCash = signal(false);
  protected cashError = signal('');

  protected async addCash(): Promise<void> {
    const { direction, amount } = this.cashForm.getRawValue();
    const cents = parseEuro(amount);
    if (cents === null || cents <= 0) {
      this.cashError.set('Enter a positive amount like 50 or 12,50.');
      return;
    }
    this.addingCash.set(true);
    this.cashError.set('');
    try {
      await this.buffetService.addCashMovement(
        this.buffet().id,
        direction === 'in' ? cents : -cents
      );
      this.cashForm.reset();
      this.changed.emit();
    } catch (error) {
      this.cashError.set(
        errorText(error, 'The cash movement could not be saved.')
      );
    } finally {
      this.addingCash.set(false);
    }
  }

  protected async removeCash(movement: CashMovement): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Cash Movement',
      message: `The ${movement.amountCents < 0 ? 'withdrawal' : 'deposit'} of ${euro(Math.abs(movement.amountCents))} is deleted from buffet ${this.buffet().location}.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;
    try {
      await this.buffetService.deleteCashMovement(movement.id);
      this.changed.emit();
    } catch (error) {
      this.toast.error(
        errorText(error, 'The cash movement could not be deleted.')
      );
    }
  }
}
