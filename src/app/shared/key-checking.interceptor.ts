import { HttpClient, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, mergeMap, retry, tap, timer } from 'rxjs';

export const E2EE_ENABLED = new HttpContextToken<boolean>(() => false)

export const keyCheckingInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient)

  if (req.context.get(E2EE_ENABLED)) {
    const clientPublicJwkStr = sessionStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = sessionStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = sessionStorage.getItem('serverPublicJwkStr')

    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {
      return generateKeys(http).pipe(
        mergeMap(serverPublicJwkStr => next(req))
      )
    }
  }
  return next(req).pipe(
    retry({
      delay: (err, count) => {
        if (count > 1 || err.status !== 428)
          throw err
        return generateKeys(http).pipe(
          mergeMap(serverPublicJwkStr => timer(1))
        )
      }
    })
  )
};

const rsaKeyGeneration = {
  name: "RSA-OAEP",
  hash: "SHA-256",
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
}

function generateKeys(http: HttpClient) {
  let clientPublicJwk: JsonWebKey
  let clientPrivateJwk: JsonWebKey

  return from(
    window.crypto.subtle.generateKey(rsaKeyGeneration, true, ["encrypt", "decrypt"])
  ).pipe(
    mergeMap(clientKeyPair => Promise.all([
      window.crypto.subtle.exportKey('jwk', (clientKeyPair.publicKey)),
      window.crypto.subtle.exportKey('jwk', (clientKeyPair.privateKey))
    ])),

    mergeMap(keys => {
      clientPublicJwk = keys[0]
      clientPrivateJwk = keys[1]

      return http.post(
        'http://localhost:3000/authentication/exchangePublicKey',
        clientPublicJwk,
        { responseType: 'text', withCredentials: true }
      )
    }),

    tap(_serverPublicJwkStr => {
      sessionStorage.setItem('clientPublicJwkStr', JSON.stringify(clientPublicJwk))
      sessionStorage.setItem('clientPrivateJwkStr', JSON.stringify(clientPrivateJwk))
      sessionStorage.setItem('serverPublicJwkStr', _serverPublicJwkStr)
    })
  )
}
