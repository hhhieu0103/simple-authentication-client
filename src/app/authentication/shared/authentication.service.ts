import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { mergeMap } from 'rxjs';

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

    //       return this.http.post(
    //         this.baseUrl + 'signup',
    //         encryptedAccount,
    //         { headers: { 'Content-Type': 'application/octet-stream' }, withCredentials: true })

  }

  setUpSecureConnection() {
    const clientPublicJwkStr = localStorage.getItem('clientPublicJwkStr')
    const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
    const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')

    // Check if the app have all necessary keys for a secure connection
    if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr) {
      // Generate client keys
      window.crypto.subtle.generateKey(
        rsaGenerationObj, true, ["encrypt", "decrypt"]
      ).then(keys => {

        // Export client keys for transfering and storing
        const clientPublicJwkPromise = window.crypto.subtle.exportKey('jwk', keys.publicKey)
        const clientPrivateJwkPromise = window.crypto.subtle.exportKey('jwk', keys.privateKey)
        // Wait for the keys to be exported
        Promise.all([clientPublicJwkPromise, clientPrivateJwkPromise]).then(jwks => {
          const clientPublicJwk = jwks[0]
          const clientPrivateJwk = jwks[1]

          // Make a request for exchanging public keys between client and server
          this.http.post(
            this.baseUrl + 'exchangePublicKey',
            clientPublicJwk,
            { responseType: 'text', withCredentials: true }
          ).subscribe({
            next: serverPublicJwkStr => {
              // Store client keys and server public key in local storage
              localStorage.setItem('clientPublicJwkStr', JSON.stringify(clientPublicJwk))
              localStorage.setItem('clientPrivateJwkStr', JSON.stringify(clientPrivateJwk))
              localStorage.setItem('serverPublicJwkStr', serverPublicJwkStr)
            },
            error: error => {
              console.log(error)
            }
          })

        }).catch(error => {
          console.log(error)
        })

      }).catch(error => {
        console.log(error)
      })
    } else {
      // The connection between server and client is already secure
    }
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
