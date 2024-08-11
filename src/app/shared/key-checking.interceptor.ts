import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { mergeMap, tap } from 'rxjs';
import { CryptographyService } from './cryptography.service';

export const E2EE_ENABLED = new HttpContextToken<boolean>(() => false)

export const keyCheckingInterceptor: HttpInterceptorFn = (req, next) => {
  const cryptoService = inject(CryptographyService)

  if (req.context.get(E2EE_ENABLED)) {
    const clientPublicJwkStr = sessionStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = sessionStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = sessionStorage.getItem('serverPublicJwkStr')

    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {
      return cryptoService.setupSecureConnection().pipe(
        mergeMap(serverPublicJwkStr => next(req))
      )
    }
  }
  return next(req)
};