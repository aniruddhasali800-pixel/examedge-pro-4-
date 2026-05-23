
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentUser = authService.currentUser();

  if (currentUser) {
    // Check if route is restricted by role
    const requiredRoles = route.data['roles'] as Array<string>;
    if (requiredRoles && !requiredRoles.some(role => currentUser.role === role)) {
      // Role not authorized so redirect to login page
      router.navigate(['/login']);
      return false;
    }
    // Authorized
    return true;
  }

  // Not logged in so redirect to login page
  router.navigate(['/login']);
  return false;
};
