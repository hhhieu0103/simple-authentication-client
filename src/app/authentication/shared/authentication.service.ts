import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, mergeMap, Observable } from 'rxjs';

export interface Account {
  username: string,
  email: string,
  password: string
}

const rsaCryptoObj = {
  name: "RSA-OAEP",
  hash: "SHA-256",
}

const rsaGenerationObj = {
  ...rsaCryptoObj,
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

  signup(account: Account) {
    this.setUpSecureConnection().subscribe({
      next: (serverPublicJwkStr) => {
        console.log(serverPublicJwkStr)
      },
      error: (error) => {
        console.log(error)
      }
    })
    //       return this.http.post(
    //         this.baseUrl + 'signup',
    //         encryptedAccount,
    //         { headers: { 'Content-Type': 'application/octet-stream' }, withCredentials: true })

  }

  private setUpSecureConnection() {
    const clientPublicJwkStr = localStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')

    // Check if the app have all necessary keys for a secure connection
    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {
      return new Observable(subcriber => {
        window.crypto.subtle.generateKey(rsaGenerationObj, true, ["encrypt", "decrypt"])
          .then(cryptoKeyPair => {
            subcriber.next(cryptoKeyPair)
            subcriber.complete()
          })
          .catch(error => subcriber.error(error))
      })
        .pipe(
          mergeMap(cryptoKeyPair => {
            // Export client keys for transfering and storing
            const clientPublicJwkPromise = window.crypto.subtle.exportKey('jwk', (cryptoKeyPair as CryptoKeyPair).publicKey)
            const clientPrivateJwkPromise = window.crypto.subtle.exportKey('jwk', (cryptoKeyPair as CryptoKeyPair).privateKey)
            // Wait for the keys to be exported
            return Promise.all([clientPublicJwkPromise, clientPrivateJwkPromise])
          }),
          mergeMap(jwks => {
            const clientPublicJwk = jwks[0]
            const clientPrivateJwk = jwks[1]
            // Make a request for exchanging public keys between client and server
            return this.http.post(
              this.baseUrl + 'exchangePublicKey',
              clientPublicJwk,
              { responseType: 'text', withCredentials: true }
            ).pipe(
              map(serverPublicJwkStr => {
                return { serverPublicJwkStr, clientPublicJwk, clientPrivateJwk }
              })
            )
          }),
          map(keys => {
            // Store client keys and server public key in local storage
            localStorage.setItem('clientPublicJwkStr', JSON.stringify(keys.clientPublicJwk))
            localStorage.setItem('clientPrivateJwkStr', JSON.stringify(keys.clientPrivateJwk))
            localStorage.setItem('serverPublicJwkStr', keys.serverPublicJwkStr)

            return keys.serverPublicJwkStr
          })
        )
    } else return new Observable(subcriber => {
      subcriber.next(serverPublicJwkStr)
      subcriber.complete()
    })
  }

  private encryptMessage(encryptKey: CryptoKey, message: string) {
    const encoded = new TextEncoder().encode(message)
    return window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      encryptKey,
      encoded,
    );
  }
}
