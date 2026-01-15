import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '@/core/services/admin.service';

@Component({
  selector: 'app-admin-overview',
  imports: [FormsModule],
  templateUrl: './admin-overview.component.html',
})
export class AdminOverviewComponent implements OnInit {
  private service: AdminService = inject(AdminService);

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

  async deleteAdmin(name: string) {
    await this.service.deleteAdmin(name);
    this.admins.set(await this.service.getAdmins());
  }
}
