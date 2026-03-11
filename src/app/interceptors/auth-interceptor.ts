import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { Auth } from '../core/services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(Auth);
  const token = auth.obtenirToken();

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
          auth.seDeconnecter();
        }
        if (err.status === 403) {
          router.navigate(['/']);
        }
      }
    })
  );
};
