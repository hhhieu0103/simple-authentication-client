import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, mergeMap, tap, of } from 'rxjs';

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
      mergeMap(serverPublicJwkStr => this.encrypt(JSON.stringify(account))),

      mergeMap(encryptedAccount => {
        return this.http.post(
          this.baseUrl + 'signup',
          encryptedAccount,
          {
            headers: { 'Content-Type': 'application/octet-stream' },
            withCredentials: true,
            responseType: 'arraybuffer'
          })
      }),

      mergeMap(encryptedResponse => this.decrypt(encryptedResponse))
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

  async encrypt(message: string) {
    const serverPublicJwkStr = localStorage.getItem('serverPublicJwkStr')
    if (!serverPublicJwkStr) throw new Error('Missing server public key.')
    const serverPublicJwk = JSON.parse(serverPublicJwkStr)
    const serverPublicKey = await window.crypto.subtle.importKey('jwk', serverPublicJwk, rsa, true, ['encrypt'])
    const encoded = new TextEncoder().encode(message)
    return window.crypto.subtle.encrypt(rsa, serverPublicKey, encoded)
  }

  async decrypt(encrypted: ArrayBuffer) {
    const clientPrivateJwkStr = localStorage.getItem('clientPrivateJwkStr')
    if (!clientPrivateJwkStr) throw new Error('Missing client private key.')
    const clientPrivateJwk = JSON.parse(clientPrivateJwkStr)
    const clientPrivateKey = await window.crypto.subtle.importKey('jwk', clientPrivateJwk, rsa, true, ['decrypt']);
    const decrypted = await window.crypto.subtle.decrypt(rsa, clientPrivateKey, encrypted);
    return new TextDecoder().decode(decrypted);
  }
}
