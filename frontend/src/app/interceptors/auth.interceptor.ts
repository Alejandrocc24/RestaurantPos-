import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Verificar que estamos en el navegador (no en SSR)
  if (typeof window === 'undefined') {
    console.log('🔐 [authInterceptor] SSR - omitiendo interceptor');
    return next(req);
  }

  // Agregar token JWT si existe
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');

  console.log('🔐 [authInterceptor] URL:', req.url);
  console.log('🔐 [authInterceptor] Token exists:', !!token);
  console.log('🔐 [authInterceptor] TenantId exists:', !!tenantId);
  console.log('🔐 [authInterceptor] Token value:', token ? token.substring(0, 20) + '...' : 'null');

  let modifiedReq = req;

  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('✅ [authInterceptor] Authorization header agregado');
  } else {
    console.warn('⚠️ [authInterceptor] No hay token disponible');
  }

  // Agregar tenant ID para endpoints que lo requieren
  if (tenantId && !req.url.includes('/auth/login') && !req.url.includes('/tenants')) {
    modifiedReq = modifiedReq.clone({
      headers: modifiedReq.headers.set('x-tenant-id', tenantId),
    });
    console.log('✅ [authInterceptor] x-tenant-id header agregado:', tenantId);
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ [authInterceptor] Error de respuesta:', error.status, error.message);
      
      // Si token es inválido, limpiar y redirigir a login
      if (error.status === 401) {
        console.error('❌ [authInterceptor] 401 Unauthorized - limpiando sesión');
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('user');
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
