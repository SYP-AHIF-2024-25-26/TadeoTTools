import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RELEASES_URL, VersionService } from '@/core/services/version.service';
import { MarkdownComponent } from '@/shared/components/markdown/markdown.component';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';
import { Release } from '@/shared/models/types';

// What runs on this server, and the releases from GitHub. A new release shows
// up here before it is installed: only the deployment moves the mark.
@Component({
  selector: 'app-version',
  imports: [DatePipe, MarkdownComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './version.component.html',
})
export class VersionComponent implements OnInit {
  private readonly service = inject(VersionService);

  protected readonly releasesUrl = RELEASES_URL;
  protected readonly dashboardVersion = window.__env?.version || 'dev';
  protected readonly backendVersion = signal<string | null>(null);
  protected readonly backendFailed = signal(false);
  protected readonly releases = signal<Release[] | null>(null);
  protected readonly releasesFailed = signal(false);

  ngOnInit() {
    void this.loadBackendVersion();
    void this.loadReleases();
  }

  protected isInstalled(release: Release): boolean {
    return release.tag_name === `v${this.backendVersion()}`;
  }

  private async loadBackendVersion() {
    try {
      this.backendVersion.set(await this.service.getBackendVersion());
    } catch (e) {
      console.error('Failed to load the backend version', e);
      this.backendFailed.set(true);
    }
  }

  private async loadReleases() {
    try {
      this.releases.set(await this.service.getReleases());
    } catch (e) {
      console.error('Failed to load the releases', e);
      this.releasesFailed.set(true);
    }
  }
}
