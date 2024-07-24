import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, mergeMap, tap, catchError, take } from 'rxjs';
import { E2EE_ENABLED } from '../../shared/e2ee.interceptor';

export interface IAccount {
  username: string,
  email: string,
  password: string
}

const rsaKeyGeneration = {
  name: "RSA-OAEP",
  hash: "SHA-256",
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

    this.http.post(
      this.baseUrl + 'signup', account,
      { context: new HttpContext().set(E2EE_ENABLED, true) }
    ).pipe(

      catchError((error, caught) => {
        if (error.name == 'missingKeys') {
          return this.generateKeys().pipe(
            mergeMap(serverPublicKey => caught)
          )
        } else {
          throw error
        }
      }),
      take(1)

    ).subscribe(res => {
      console.log(res)
    })

  }

  private generateKeys() {
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
}
