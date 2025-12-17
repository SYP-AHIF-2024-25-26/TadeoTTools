import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '@/core/services/auth.service';

export const adminOrTeacherGuard: CanActivateFn = async () => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  try {
    const isAdmin = await loginService.checkUserRole('is-admin', 'admin');
    const isTeacher = await loginService.checkUserRole('is-teacher', 'teacher');
    if (isAdmin || isTeacher) {
      return true;
    }
    router.navigate(['/student']);
    return false;
  } catch {
    router.navigate(['/student']);
    return false;
  }
};
