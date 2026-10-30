import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { VisitorPhotoService } from '@/core/services/visitor-photo.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { VisitorPhoto } from '@/shared/models/types';
import { downloadFile } from '@/shared/utils/utils';

const REFRESH_MS = 30_000;

const time = new Intl.DateTimeFormat('de-AT', {
  timeZone: 'Europe/Vienna',
  hour: '2-digit',
  minute: '2-digit',
});

// Lets the Roboterführerschein stop find the photo of a visitor by number: a
// paged grid of number buttons; a click shows that photo next to the grid, with
// a download. Shows no photo until one is clicked. Renders nothing for users
// without access, so pages can embed it for everyone.
@Component({
  selector: 'app-visitor-photos',
  templateUrl: './visitor-photos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisitorPhotosComponent {
  private photoService = inject(VisitorPhotoService);
  private toast = inject(ToastService);

  // On the students' and stop managers' pages: only for the people of the stop,
  // not for admins who look at those pages (they have the Registrations tab).
  atStopOnly = input(false);
  // The admin tab passes its photo count; a change (e.g. after deleting) reloads the index.
  total = input<number | null>(null);

  protected readonly pageSizes = [20, 50, 100];

  protected allowed = signal(false);
  private photos = signal<VisitorPhoto[]>([]);
  protected loadFailed = signal(false);
  protected selected = signal<number | null>(null);
  protected missing = signal(false);
  protected downloading = signal<number | 'zip' | null>(null);
  protected pageSize = signal(20);
  private page = signal(0);

  // The backend lists newest first; the grid counts up from number 1.
  protected sorted = computed(() =>
    [...this.photos()].sort((a, b) => a.id - b.id)
  );
  protected highest = computed(() => this.sorted().at(-1)?.id ?? 0);
  protected pageCount = computed(() =>
    Math.max(1, Math.ceil(this.sorted().length / this.pageSize()))
  );
  // Stays valid when the list shrinks (photos deleted) or the page size grows.
  protected pageIndex = computed(() =>
    Math.min(this.page(), this.pageCount() - 1)
  );
  protected pagePhotos = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sorted().slice(start, start + this.pageSize());
  });

  protected readonly url = (id: number) => this.photoService.url(id);
  protected readonly time = (photo: VisitorPhoto) =>
    time.format(new Date(photo.createdAt));

  constructor() {
    void this.init();

    // The stop prints all day: keep the index current while the tab is visible.
    const timer = setInterval(() => this.refreshIfVisible(), REFRESH_MS);
    const onVisible = () => this.refreshIfVisible();
    document.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });

    effect(() => {
      this.total();
      untracked(() => this.refreshIfVisible());
    });
  }

  private async init(): Promise<void> {
    const viewer = await this.photoService.getPhotoViewer();
    if (!viewer || (this.atStopOnly() && !viewer.atStop)) return;
    this.allowed.set(true);
    await this.load();
  }

  private refreshIfVisible(): void {
    if (this.allowed() && document.visibilityState === 'visible') {
      void this.load();
    }
  }

  protected async load(): Promise<void> {
    try {
      this.photos.set(await this.photoService.getIndex());
      this.loadFailed.set(false);
    } catch (error) {
      console.error('Failed to load the photos', error);
      this.loadFailed.set(true);
    }
  }

  protected goToPage(index: number): void {
    this.page.set(Math.max(0, Math.min(index, this.pageCount() - 1)));
  }

  // Keeps the first photo of the current page in view.
  protected setPageSize(value: string): void {
    const first = this.pageIndex() * this.pageSize();
    const size = Number(value);
    this.pageSize.set(size);
    this.page.set(Math.floor(first / size));
  }

  // A second click on the same number hides the photo again.
  protected show(id: number): void {
    this.missing.set(false);
    this.selected.update((current) => (current === id ? null : id));
  }

  protected async downloadPhoto(id: number): Promise<void> {
    await this.download(id, this.photoService.fileName(id), () =>
      this.photoService.getFile(id)
    );
  }

  protected async downloadZip(): Promise<void> {
    await this.download('zip', 'visitor-photos.zip', () =>
      this.photoService.getZipFile()
    );
  }

  private async download(
    what: number | 'zip',
    filename: string,
    get: () => Promise<Blob>
  ): Promise<void> {
    if (this.downloading() !== null) return;
    this.downloading.set(what);
    try {
      downloadFile(await get(), filename);
    } catch (error) {
      console.error(`Failed to download ${filename}`, error);
      this.toast.error(
        errorText(error, `${filename} could not be downloaded.`)
      );
    } finally {
      this.downloading.set(null);
    }
  }
}
