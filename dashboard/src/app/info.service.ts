import { inject, Injectable } from '@angular/core';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class InfoService {
  private readonly infoStore = inject(InfoStore);

  constructor() {}

  removeInfoById(id: number) {
    this.infoStore.removeInfoById(id);
  }
}
