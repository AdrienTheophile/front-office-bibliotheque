import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Auth } from '../services/auth';

@Injectable()
export class IntercepteurJwt implements HttpInterceptor {
  private readonly authService = inject(Auth);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.obtenirToken();

    // Ajoute le token JWT si disponible
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Gère les erreurs HTTP
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si c'est une erreur d'authentification (401), déconnecter
        if (error.status === 401) {
          this.authService.seDeconnecter();
        }

        return throwError(() => error);
      })
    );
  }
}
