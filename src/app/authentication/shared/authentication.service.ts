import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, mergeMap, tap, of } from 'rxjs';
import { E2EE_ENABLED } from '../../interceptors/e2ee.interceptor';

export interface IAccount {
  username: string,
  email: string,
  password: string
}

const rsa = {
  name: "RSA-OAEP",
  hash: "SHA-256",
}

const rsaKeyGeneration = {
  ...rsa,
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  http = inject(HttpClient)
  baseUrl = 'http://localhost:3000/authentication/'

  constructor() { }

  signup(account: IAccount) {

    this.setUpSecureConnection().pipe(
      mergeMap(() => {
        return this.http.post(
          this.baseUrl + 'signup',
          account,
          { context: new HttpContext().set(E2EE_ENABLED, true) }
        )
      }),

    ).subscribe({
      next: (res) => {
        console.log(res)
      },
      error: (error) => {
        console.log(error)
      }
    })
  }

  private setUpSecureConnection() {
    const clientPublicJwkStr = localStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')

    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {

      let clientPublicJwk: JsonWebKey
      let clientPrivateJwk: JsonWebKey

      return from(
        window.crypto.subtle.generateKey(rsaKeyGeneration, true, ["encrypt", "decrypt"])
      ).pipe(
        mergeMap(clientKeyPair => {
          return Promise.all([
            window.crypto.subtle.exportKey('jwk', (clientKeyPair.publicKey)),
            window.crypto.subtle.exportKey('jwk', (clientKeyPair.privateKey))
          ])
        }),

        mergeMap(keys => {
          clientPublicJwk = keys[0]
          clientPrivateJwk = keys[1]

          return this.http.post(
            this.baseUrl + 'exchangePublicKey',
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
    return of(serverPublicJwkStr)
  }
}
