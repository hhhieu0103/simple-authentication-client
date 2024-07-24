import { HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { mergeMap, filter, map, tap, from } from 'rxjs';
import { E2EE_ENABLED } from './key-checking.interceptor';

export const cryptographyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(E2EE_ENABLED)) {

    let encryptObs = null
    if (typeof (req.body) == 'string') encryptObs = encrypt(req.body)
    else encryptObs = encrypt(JSON.stringify(req.body))

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
      filter(event => event.type == HttpEventType.Response),
      tap(event => e = (event as HttpResponse<ArrayBuffer>)),
      mergeMap(event => decrypt((event as HttpResponse<ArrayBuffer>).body as ArrayBuffer)),
      map(decrypted => e.clone({ body: decrypted }))
    );
  }
  return next(req);
};

const rsa = {
  name: "RSA-OAEP",
  hash: "SHA-256",
}

function encrypt(message: string) {
  const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')
  if (!serverPublicJwkStr) throw new Error('Missing server public key.')
  const serverPublicJwk = JSON.parse(serverPublicJwkStr)
  const encoded = new TextEncoder().encode(message)
  return from(window.crypto.subtle.importKey('jwk', serverPublicJwk, rsa, true, ['encrypt']))
    .pipe(mergeMap(serverPublicKey => window.crypto.subtle.encrypt(rsa, serverPublicKey, encoded)))
}

function decrypt(encrypted: ArrayBuffer) {
  const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
  if (!clientPrivateJwkStr) throw new Error('Missing client private key.')
  const clientPrivateJwk = JSON.parse(clientPrivateJwkStr)
  return from(window.crypto.subtle.importKey('jwk', clientPrivateJwk, rsa, true, ['decrypt']))
    .pipe(
      mergeMap(clientPrivateKey => window.crypto.subtle.decrypt(rsa, clientPrivateKey, encrypted)),
      map(decrypted => new TextDecoder().decode(decrypted))
    )
}