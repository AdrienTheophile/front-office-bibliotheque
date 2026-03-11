import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');
  if (token) return true;
  router.navigate(['/']);
  return false;
};

export const adherentGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('auth_token');
  if (!token) {
    router.navigate(['/']);
    return false;
  }
  const stored = localStorage.getItem('auth_adherent');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user?.adherent) return true;
    } catch { /* ignore */ }
  }
  router.navigate(['/']);
  return false;
};

export const roleGuard = (...roles: string[]): CanActivateFn => {
  return () => {
    const router = inject(Router);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.navigate(['/']);
      return false;
    }
    const stored = localStorage.getItem('auth_adherent');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user?.roles?.some((r: string) => roles.includes(r))) return true;
      } catch { /* ignore */ }
    }
    router.navigate(['/']);
    return false;
  };
};
