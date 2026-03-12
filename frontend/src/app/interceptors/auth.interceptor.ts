import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Verificar que estamos en el navegador (no en SSR)
  if (typeof window === 'undefined') {
    return next(req);
  }

  // Agregar token JWT si existe
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');

  let modifiedReq = req;

  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Agregar tenant ID para endpoints que lo requieren
  if (tenantId && !req.url.includes('/auth/login') && !req.url.includes('/tenants')) {
    modifiedReq = modifiedReq.clone({
      headers: modifiedReq.headers.set('x-tenant-id', tenantId),
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('⚠️ [authInterceptor] 401 Unauthorized — cerrando sesión');
        // Limpiar sesión y redirigir a login
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
