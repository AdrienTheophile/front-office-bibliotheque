import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

const CLE_JWT = 'auth_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem(CLE_JWT);

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    tap({
      error: (err) => {
        // Ne pas déconnecter sur la route de login elle-même
        if (err.status === 401 && !req.url.includes('/login')) {
          localStorage.removeItem(CLE_JWT);
          localStorage.removeItem('auth_adherent');
          router.navigate(['/connexion']);
        }
      }
    })
  );
};
