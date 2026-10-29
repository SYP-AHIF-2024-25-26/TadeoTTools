import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BuffetService } from '@/core/services/buffet.service';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';
import { Buffet, BuffetProduct, Sales } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { BuffetProductsComponent } from './buffet-products/buffet-products.component';
import { BuffetCardComponent } from './buffet-card/buffet-card.component';
import { BuffetSalesComponent } from './buffet-sales/buffet-sales.component';
import { BuffetStatisticsComponent } from './buffet-statistics/buffet-statistics.component';

export type BuffetTab = 'products' | 'buffets' | 'sales' | 'statistics';
const TABS: BuffetTab[] = ['products', 'buffets', 'sales', 'statistics'];

// The cashier kiosk's data, one purpose per tab: products and prices, buffets and
// their menus, sales with cash and export, and read-only statistics. The tab is in
// the URL (`?tab=`) so other pages can link to it.
@Component({
  selector: 'app-buffet',
  templateUrl: './buffet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageHeaderComponent,
    BuffetProductsComponent,
    BuffetCardComponent,
    BuffetSalesComponent,
    BuffetStatisticsComponent,
  ],
})
export class BuffetComponent {
  private buffetService = inject(BuffetService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private injector = inject(Injector);
  private route = inject(ActivatedRoute);

  private queryParams = toSignal(this.route.queryParamMap);
  protected readonly tab = computed<BuffetTab>(() => {
    const tab = this.queryParams()?.get('tab') as BuffetTab | null;
    return tab && TABS.includes(tab) ? tab : 'products';
  });
  protected readonly tabs: { id: BuffetTab; label: string }[] = [
    { id: 'products', label: 'Products' },
    { id: 'buffets', label: 'Buffets' },
    { id: 'sales', label: 'Sales' },
    { id: 'statistics', label: 'Statistics' },
  ];

  protected products = signal<BuffetProduct[]>([]);
  protected buffets = signal<Buffet[]>([]);
  protected sales = signal<Sales | null>(null);
  protected loading = signal(true);
  protected loadFailed = signal(false);
  protected importing = signal(false);

  // The import only fills empty tables, so it is offered only then.
  protected canImport = computed(
    () => this.products().length === 0 && this.buffets().length === 0
  );

  protected buffetForm = new FormGroup({
    location: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(3)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
  });
  protected addingBuffet = signal(false);
  protected addBuffetError = signal('');

  private productsSection = viewChild(BuffetProductsComponent);

  private loaded = false;

  constructor() {
    // Fresh data whenever the tab changes (sales arrive all day), including the first load.
    effect(() => {
      this.tab();
      untracked(() => {
        this.load(!this.loaded);
        this.loaded = true;
      });
    });
  }

  async load(first = false): Promise<void> {
    if (first) this.loading.set(true);
    try {
      const [products, buffets, sales] = await Promise.all([
        this.buffetService.getProducts(),
        this.buffetService.getBuffets(),
        this.buffetService.getSales(),
      ]);
      this.products.set(products);
      this.buffets.set(buffets);
      this.sales.set(sales);
      this.loadFailed.set(false);
      if (first && products.length === 0 && this.tab() === 'products') {
        afterNextRender(() => this.productsSection()?.focusAdd(), {
          injector: this.injector,
        });
      }
    } catch (error) {
      console.error('Failed to load the buffet', error);
      if (first) this.loadFailed.set(true);
      else
        this.toast.error(errorText(error, 'The buffet could not be reloaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async addBuffet(): Promise<void> {
    if (this.buffetForm.invalid || this.addingBuffet()) {
      this.buffetForm.markAllAsTouched();
      return;
    }
    const { location, description } = this.buffetForm.getRawValue();
    this.addingBuffet.set(true);
    this.addBuffetError.set('');
    try {
      await this.buffetService.addBuffet({
        location: location.trim(),
        description: description.trim(),
      });
      this.buffetForm.reset();
      await this.load();
    } catch (error) {
      this.addBuffetError.set(
        error instanceof HttpErrorResponse && error.status === 409
          ? `A buffet with the location "${location.trim()}" already exists.`
          : errorText(error, 'The buffet could not be added.')
      );
    } finally {
      this.addingBuffet.set(false);
    }
  }

  protected async importLegacy(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Import from Legacy Backend',
      message:
        'Copies the products with their prices, the buffets and their menus from the old TadeoT admin, ' +
        'with the same ids, so the cashier can still fall back to the old backend. ' +
        'Old sales and cash movements are not copied.',
      confirmLabel: 'Import',
      tone: 'primary',
    });
    if (!confirmed) return;
    this.importing.set(true);
    try {
      const result = await this.buffetService.importFromLegacy();
      this.toast.success(
        `Imported ${plural(result.products, 'product')}, ${plural(result.buffets, 'buffet')} and ${plural(result.menuEntries, 'menu item')}.`
      );
      await this.load();
    } catch (error) {
      this.toast.error(errorText(error, 'The import failed.'));
    } finally {
      this.importing.set(false);
    }
  }
}
