import { Component, inject, OnInit, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { FormsModule } from '@angular/forms';
import { AdminService } from '@/core/services/admin.service';

@Component({
  selector: 'app-admin-overview',
  imports: [FormsModule, DeletePopupComponent],
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent implements OnInit {
  private service: AdminService = inject(AdminService);
  private keycloak = inject(Keycloak);

  // The backend matches admins by the token's preferred_username, case-insensitively.
  private readonly currentUser = String(
    this.keycloak.tokenParsed?.['preferred_username'] ?? ''
  ).toLowerCase();

  addname = signal<string>('');
  admins = signal<string[]>([]);

  async ngOnInit() {
    this.admins.set(await this.service.getAdmins());
  }

  async addAdmin() {
    if (this.addname().trim() !== '') {
      await this.service.addAdmin(this.addname());
      this.addname.set('');
      this.admins.set(await this.service.getAdmins());
    }
  }

  adminToDelete = signal<string | null>(null);
  deleting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  isCurrentUser(name: string): boolean {
    return name.toLowerCase() === this.currentUser;
  }

  async deleteAdmin() {
    const name = this.adminToDelete();
    if (name === null || this.isCurrentUser(name)) {
      return;
    }
    this.deleting.set(true);
    this.errorMessage.set(null);
    try {
      await this.service.deleteAdmin(name);
      this.admins.set(await this.service.getAdmins());
    } catch (error) {
      console.error('Failed to delete admin', error);
      this.errorMessage.set(`${name} could not be removed. Please try again.`);
    } finally {
      this.deleting.set(false);
      this.adminToDelete.set(null);
    }
  }
}
