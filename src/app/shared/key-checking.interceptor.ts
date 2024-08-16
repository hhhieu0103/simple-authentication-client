import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { mergeMap } from 'rxjs';
import { CryptographyService } from './cryptography.service';
import { CookieService } from './cookie.service';

export const E2EE_ENABLED = new HttpContextToken<boolean>(() => false)

export const keyCheckingInterceptor: HttpInterceptorFn = (req, next) => {
  const cryptoService = inject(CryptographyService)
  const cookieService = inject(CookieService)

  if (req.context.get(E2EE_ENABLED)) {
    const clientPublicJwkStr = sessionStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = sessionStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = cookieService.getCookie('serverPublicJwkStr')

    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {
      return cryptoService.setupSecureConnection().pipe(
        mergeMap(() => next(req))
      )
    }
  }
  return next(req)
};