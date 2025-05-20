import { Component, inject, Input } from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLinkActive],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
  standalone: true,
})
export class BreadcrumbComponent {
  protected router = inject(Router);
  @Input() name!: string;
  @Input({ required: true }) stopGroupId!: number;
}
