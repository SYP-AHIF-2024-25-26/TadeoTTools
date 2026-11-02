import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { BuffetService } from '@/core/services/buffet.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { Buffet, Sales } from '@/shared/models/types';
import { downloadFile, plural } from '@/shared/utils/utils';
import { euro } from '../money';
import { BuffetTillComponent } from '../buffet-till/buffet-till.component';

@Component({
  selector: 'app-buffet-sales',
  templateUrl: './buffet-sales.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeletePopupComponent, BuffetTillComponent],
})
export class BuffetSalesComponent {
  private buffetService = inject(BuffetService);
  private toast = inject(ToastService);

  sales = input.required<Sales>();
  buffets = input.required<Buffet[]>();
  changed = output<void>();

  protected readonly euro = euro;
  protected readonly plural = plural;

  // Each buffet with its sales; a buffet without sales still has a till.
  protected tills = computed(() =>
    this.buffets().map((buffet) => ({
      buffet,
      sales: this.sales().buffets.find((s) => s.buffetId === buffet.id),
    }))
  );
  protected cashTotal = computed(() =>
    this.buffets()
      .flatMap((b) => b.cashMovements)
      .reduce((sum, m) => sum + m.amountCents, 0)
  );

  protected downloading = signal(false);
  protected confirmingDelete = signal(false);
  protected deleting = signal(false);

  async downloadCsv(): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(true);
    try {
      downloadFile(await this.buffetService.getSalesFile(), 'buffet-sales.csv');
    } catch (error) {
      console.error('Failed to download the sales', error);
      this.toast.error(errorText(error, 'The sales could not be downloaded.'));
    } finally {
      this.downloading.set(false);
    }
  }

  protected deleteMessage(): string {
    const s = this.sales();
    return (
      `This deletes ${plural(s.orderCount, 'sale')} (${euro(s.revenueCents)}) at every buffet. ` +
      'Products, menus and cash movements stay. ' +
      "This can't be undone, so export the CSV first if you want to keep the sales."
    );
  }

  protected async deleteAll(): Promise<void> {
    if (this.deleting()) return;
    this.deleting.set(true);
    try {
      await this.buffetService.deleteSales();
      this.confirmingDelete.set(false);
      this.toast.success('All sales deleted.');
      this.changed.emit();
    } catch (error) {
      this.toast.error(errorText(error, 'The sales could not be deleted.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
