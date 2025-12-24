import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FilterStateService {
  readonly divisionFilter = signal<number>(0);
  readonly stopNameSearchTerm = signal<string>('');
  readonly stopGroupFilter = signal<string>('');
  readonly stopManagerSearchTerm = signal<string>('');

  clear(): void {
    this.divisionFilter.set(0);
    this.stopNameSearchTerm.set('');
    this.stopGroupFilter.set('');
    this.stopManagerSearchTerm.set('');
  }
}
