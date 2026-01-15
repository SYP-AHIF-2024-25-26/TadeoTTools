import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Info } from '@/shared/models/types';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-info-popup',
  standalone: true,
  imports: [NgClass],
  templateUrl: './info-modal.component.html',
})
export class InfoPopupComponent implements OnInit {
  @Input() info: Info | undefined;
  @Output() deleted = new EventEmitter<number>();

  ngOnInit() {
    setTimeout(() => {
      this.closePopup();
    }, 4000);
  }

  closePopup() {
    this.deleted.emit(this.info!.id);
  }
}
