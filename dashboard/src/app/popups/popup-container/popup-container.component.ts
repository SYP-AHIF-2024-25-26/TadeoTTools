import {Component, computed, inject} from '@angular/core';
import {InfoStore} from "../../store/info.store";
import {InfoPopupComponent} from "../info-popup/info-popup.component";

@Component({
  selector: 'app-popup-container',
  imports: [
    InfoPopupComponent
  ],
  templateUrl: './popup-container.component.html',
  styleUrl: './popup-container.component.css'
})
export class PopupContainerComponent {
  public infoStore = inject(InfoStore);

  infos = computed(() => {
    return this.infoStore.infos();
  });

  removeInfo(id: number) {
    this.infoStore.removeInfoById(id);
  }
}
