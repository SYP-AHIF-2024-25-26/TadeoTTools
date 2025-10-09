import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from '../login.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  try {
    const isAdmin = await loginService.checkUserRole('is-admin', 'admin');
    if (isAdmin) {
      return true;
    } else {
        const isTeacher = await loginService.checkUserRole('is-teacher', 'teacher');
        if (isTeacher) {
        return true;
        } else {
        router.navigate(['/student']);
        return false;
        }
    }
  } catch (error) {
    console.error('Error checking admin role:', error);
    router.navigate(['/student']);
    return false;
  }
};