import { HttpContextToken, HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { mergeMap, filter, map, from, tap } from 'rxjs';

export const E2EE_ENABLED = new HttpContextToken<boolean>(() => false)

export const e2eeInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(E2EE_ENABLED)) {

    let encryptPromise = null
    if (typeof (req.body) == 'string') encryptPromise = encrypt(req.body)
    else encryptPromise = encrypt(JSON.stringify(req.body))

    const newEvent = from(encryptPromise).pipe(
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

async function encrypt(message: string) {
  const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')
  if (!serverPublicJwkStr) throw new Error('Missing server public key.')
  const serverPublicJwk = JSON.parse(serverPublicJwkStr)
  const serverPublicKey = await window.crypto.subtle.importKey('jwk', serverPublicJwk, rsa, true, ['encrypt'])
  const encoded = new TextEncoder().encode(message)
  return window.crypto.subtle.encrypt(rsa, serverPublicKey, encoded)
}

async function decrypt(encrypted: ArrayBuffer) {
  const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
  if (!clientPrivateJwkStr) throw new Error('Missing client private key.')
  const clientPrivateJwk = JSON.parse(clientPrivateJwkStr)
  const clientPrivateKey = await window.crypto.subtle.importKey('jwk', clientPrivateJwk, rsa, true, ['decrypt']);
  const decrypted = await window.crypto.subtle.decrypt(rsa, clientPrivateKey, encrypted);
  return new TextDecoder().decode(decrypted);
}