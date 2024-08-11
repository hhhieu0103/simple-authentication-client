import { HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { mergeMap, filter, map, tap, catchError } from 'rxjs';
import { E2EE_ENABLED } from './key-checking.interceptor';
import { CryptographyService } from './cryptography.service';
import { inject } from '@angular/core';

export const cryptographyInterceptor: HttpInterceptorFn = (req, next) => {
  let cryptoService = inject(CryptographyService)

  if (req.context.get(E2EE_ENABLED)) {

    let encryptObs = null
    if (typeof (req.body) == 'string') encryptObs = cryptoService.encrypt(req.body)
    else encryptObs = cryptoService.encrypt(JSON.stringify(req.body))

    const newEvent = encryptObs.pipe(
      mergeMap(bodyAb => {
        const encryptedBody = req.clone({
          headers: req.headers.set('Content-Type', 'application/octet-stream'),
          withCredentials: true,
          body: bodyAb,
          responseType: 'arraybuffer'
        })
        return next(encryptedBody)
      })
    )

    let e: HttpResponse<ArrayBuffer>
    return newEvent.pipe(
      catchError((err) => { throw err }),
      filter(event => event.type == HttpEventType.Response),
      tap(event => e = (event as HttpResponse<ArrayBuffer>)),
      mergeMap(event => cryptoService.decrypt((event as HttpResponse<ArrayBuffer>).body as ArrayBuffer)),
      map(decrypted => e.clone({ body: JSON.parse(decrypted) }))
    );
  }
  return next(req);
};

