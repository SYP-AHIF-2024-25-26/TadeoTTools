import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '@/core/services/auth.service';

// Admins and the stop managers of the Buffet stop.
export const buffetManagerGuard: CanActivateFn = async () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (await loginService.checkUserRole('is-buffet-manager', 'buffet')) {
    return true;
  }

  const isStopManager = await loginService.checkUserRole(
    'in-database',
    'stopmanager'
  );
  router.navigate([isStopManager ? '/stop-manager' : '/student']);
  return false;
};
