import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLinkActive],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  protected router = inject(Router);
  name = input<string>();
  stopGroupId = input.required<number>();
}
