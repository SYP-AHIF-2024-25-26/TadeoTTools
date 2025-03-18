import {Component, inject} from '@angular/core';
import {NgClass} from "@angular/common";
import {Router} from "@angular/router";
import Keycloak from "keycloak-js";

@Component({
  selector: 'app-admin-dropdown',
  imports: [
    NgClass
  ],
  templateUrl: './admin-dropdown.component.html',
  styleUrl: './admin-dropdown.component.css'
})
export class AdminDropdownComponent {
  isOpen = false;
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);
  items = ['Student View', 'Teacher View', 'Logout'];

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
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
      await this.router.navigate(['login']);
      await this.keycloak.logout();
    }
    this.isOpen = false;
  }
}
