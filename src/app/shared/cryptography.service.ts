import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { from, map, mergeMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CryptographyService {
  rsa = {
    name: "RSA-OAEP",
    hash: "SHA-256",
  }

  rsaKeyGeneration = {
    name: "RSA-OAEP",
    hash: "SHA-256",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
  }

  constructor(private http: HttpClient) { }

  encrypt(message: string) {
    const serverPublicJwkStr = sessionStorage.getItem('serverPublicJwkStr')
    if (!serverPublicJwkStr) throw new Error('Missing server public key.')
    const serverPublicJwk = JSON.parse(serverPublicJwkStr)
    const encoded = new TextEncoder().encode(message)
    return from(window.crypto.subtle.importKey('jwk', serverPublicJwk, this.rsa, true, ['encrypt']))
      .pipe(mergeMap(serverPublicKey => window.crypto.subtle.encrypt(this.rsa, serverPublicKey, encoded)))
  }

  decrypt(encrypted: ArrayBuffer) {
    const clientPrivateJwkStr = sessionStorage.getItem('clientPrivateJwkStr')
    if (!clientPrivateJwkStr) throw new Error('Missing client private key.')
    const clientPrivateJwk = JSON.parse(clientPrivateJwkStr)
    return from(window.crypto.subtle.importKey('jwk', clientPrivateJwk, this.rsa, true, ['decrypt']))
      .pipe(
        mergeMap(clientPrivateKey => window.crypto.subtle.decrypt(this.rsa, clientPrivateKey, encrypted)),
        map(decrypted => new TextDecoder().decode(decrypted))
      )
  }

  setupSecureConnection() {
    return from(
      window.crypto.subtle.generateKey(this.rsaKeyGeneration, true, ["encrypt", "decrypt"])
    ).pipe(
      mergeMap(clientKeyPair => Promise.all([
        window.crypto.subtle.exportKey('jwk', (clientKeyPair.publicKey)),
        window.crypto.subtle.exportKey('jwk', (clientKeyPair.privateKey))
      ])),
      tap(keys => {
        sessionStorage.setItem('clientPublicJwkStr', JSON.stringify(keys[0]))
        sessionStorage.setItem('clientPrivateJwkStr', JSON.stringify(keys[1]))
      }),
      mergeMap(keys => this.http.post(
        'http://localhost:3000/authentication/exchangePublicKey',
        keys[0], { responseType: 'text', withCredentials: true }
      )),
      tap(serverPublicJwkStr => {
        sessionStorage.setItem('serverPublicJwkStr', serverPublicJwkStr)
      }),
    )
  }
}
