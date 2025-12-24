import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '@/core/services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  try {
    const isAdmin = await loginService.checkUserRole('is-admin', 'admin');
    if (isAdmin) {
      return true;
    }

    const isStopManager = await loginService.checkUserRole(
      'in-database',
      'stopmanager'
    );
    if (isStopManager) {
      router.navigate(['/stop-manager']);
    } else {
      router.navigate(['/student']);
    }
    return false;
  } catch {
    router.navigate(['/student']);
    return false;
  }
};
