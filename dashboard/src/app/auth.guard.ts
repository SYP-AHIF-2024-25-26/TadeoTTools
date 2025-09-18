import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';

// Protect routes by requiring an authenticated Keycloak session.
// If the user is not authenticated, redirect to the Keycloak login and cancel navigation.
export const authGuard: CanMatchFn = async () => {
  const keycloak = inject(Keycloak);
  const router = inject(Router);

  if (keycloak.authenticated) {
    return true;
  }

  try {
    await keycloak.login({ redirectUri: window.location.href });
  } catch (e) {
    // Optional: navigate to a local fallback route if login fails
    // router.navigate(['/login']);
    console.error('Keycloak login redirect failed', e);
  }

  return false;
};
