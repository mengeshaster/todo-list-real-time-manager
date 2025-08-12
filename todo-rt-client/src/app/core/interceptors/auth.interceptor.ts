import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor for adding authentication headers to requests
 * and handling 401 authentication failures
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const authToken = authService.getToken();

  const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');
  const isLogoutRequest = req.url.includes('/auth/logout');

  let authReq = req;
  if (authToken && !isAuthRequest) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authToken}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest && !isLogoutRequest) {
        console.log('🚫 Authentication failed (401), clearing auth data and redirecting');

        authService.clearAuthData();
        router.navigate(['/auth']);
      }

      return throwError(() => error);
    })
  );
};
