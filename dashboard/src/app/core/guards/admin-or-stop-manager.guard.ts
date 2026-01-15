import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '@/core/services/auth.service';

export const adminOrStopManagerGuard: CanActivateFn = async () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  try {
    const isAdmin = await loginService.checkUserRole('in-database', 'admin');
    const isStopManager = await loginService.checkUserRole(
      'in-database',
      'stopmanager'
    );
    if (isAdmin || isStopManager) {
      return true;
    }
    router.navigate(['/student']);
    return false;
  } catch {
    router.navigate(['/student']);
    return false;
  }
};
