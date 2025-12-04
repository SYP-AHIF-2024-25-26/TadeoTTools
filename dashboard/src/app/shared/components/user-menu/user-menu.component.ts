import {
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-admin-dropdown',
  imports: [NgClass],
  templateUrl: './user-menu.component.html',
})
export class AdminDropdownComponent {
  isOpen = signal(false);
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);
  items = ['Student View', 'Teacher View', 'Logout'];

  @ViewChild('dropdown', { static: false }) dropdownRef!: ElementRef;

  toggleDropdown(): void {
    this.isOpen.set(!this.isOpen());
  }

  async selectItem(item: string): Promise<void> {
    if (item === 'Student View') {
      await this.router.navigate(['student']);
    } else if (item === 'Teacher View') {
      await this.router.navigate(['teacher']);
    } else {
      if (!this.keycloak.authenticated) {
        return;
      }
      await this.keycloak.logout({
        redirectUri: window.location.origin + '/admin/',
      });
    }
    this.isOpen.set(false);
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.isOpen()) return;
    if (
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(event.target)
    ) {
      this.isOpen.set(false);
    }
  }
}
