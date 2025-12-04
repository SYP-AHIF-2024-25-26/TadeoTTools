import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  try {
    const isAdmin = await loginService.checkUserRole('is-admin', 'admin');
    if (isAdmin) {
      return true;
    }

    const isTeacher = await loginService.checkUserRole('is-teacher', 'teacher');
    if (isTeacher) {
      router.navigate(['/teacher']);
    } else {
      router.navigate(['/student']);
    }
    return false;
  } catch {
    router.navigate(['/student']);
    return false;
  }
};
