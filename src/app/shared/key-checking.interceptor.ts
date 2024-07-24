import { HttpClient, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, mergeMap, tap } from 'rxjs';

export const E2EE_ENABLED = new HttpContextToken<boolean>(() => false)

export const keyCheckingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(E2EE_ENABLED)) {
    const clientPublicJwkStr = localStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')

    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {
      const http = inject(HttpClient)
      return generateKeys(http).pipe(
        mergeMap(serverPublicJwkStr => next(req))
      )
    }
  }
  return next(req)
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
      localStorage.setItem('clientPublicJwkStr', JSON.stringify(clientPublicJwk))
      localStorage.setItem('clientPrivateJwkStr', JSON.stringify(clientPrivateJwk))
      localStorage.setItem('serverPublicJwkStr', _serverPublicJwkStr)
    })
  )
}
