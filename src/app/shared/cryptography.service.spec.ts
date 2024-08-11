import { CryptographyService } from './cryptography.service';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('CryptographyService', () => {
  let cryptoService: CryptographyService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let mockKeyPair: CryptoKeyPair;
  let mockPublicJwk: JsonWebKey;
  let mockPrivateJwk: JsonWebKey;
  const message = 'I\'m not a bad slime'
  const encoded = new TextEncoder().encode(message)

  beforeEach(async () => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post']);
    cryptoService = new CryptographyService(httpClientSpy);
  });

  beforeAll(async () => {
    cryptoService = new CryptographyService(httpClientSpy);
    mockKeyPair = await window.crypto.subtle.generateKey(cryptoService.rsaKeyGeneration, true, ["encrypt", "decrypt"]);
    mockPublicJwk = await window.crypto.subtle.exportKey('jwk', mockKeyPair.publicKey);
    mockPrivateJwk = await window.crypto.subtle.exportKey('jwk', mockKeyPair.privateKey);
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('#setupSecureConnection generates, stores and exchanges keys', (done: DoneFn) => {
    httpClientSpy.post.and.returnValue(of(JSON.stringify(mockPublicJwk)))
    cryptoService.setupSecureConnection().subscribe(async serverJwkStr => {
      // Expect keys are store in session storage
      const clientPublicJwkStr = sessionStorage.getItem('clientPublicJwkStr')
      const clientPrivateJwkStr = sessionStorage.getItem('clientPrivateJwkStr')
      const serverPublicJwkStr = sessionStorage.getItem('serverPublicJwkStr')

      if (!clientPublicJwkStr || !clientPrivateJwkStr || !serverPublicJwkStr)
        fail('Keys are not stored in session storage')

      expect(serverPublicJwkStr).withContext('Server public key stored in session storage').toBe(JSON.stringify(mockPublicJwk))

      //Expect keys are importable
      let clientPublicKey: CryptoKey | undefined = undefined
      let clientPrivateKey: CryptoKey | undefined = undefined
      let serverPublicKey: CryptoKey | undefined = undefined

      try {
        clientPublicKey = await window.crypto.subtle.importKey('jwk', JSON.parse(clientPublicJwkStr as string), cryptoService.rsa, true, ['encrypt'])
        clientPrivateKey = await window.crypto.subtle.importKey('jwk', JSON.parse(clientPrivateJwkStr as string), cryptoService.rsa, true, ['decrypt'])
        serverPublicKey = await window.crypto.subtle.importKey('jwk', JSON.parse(serverPublicJwkStr as string), cryptoService.rsa, true, ['encrypt'])
      } catch (err) {
        fail(new Error('Keys are not importable', { cause: err }))
      }

      //Expect keys are able to work with each other
      const encrypted = await window.crypto.subtle.encrypt(cryptoService.rsa, (clientPublicKey as CryptoKey), encoded)
      const decrypted = await window.crypto.subtle.decrypt(cryptoService.rsa, (clientPrivateKey as CryptoKey), encrypted)
      const decoded = new TextDecoder().decode(decrypted)
      expect(decoded).withContext('Generated keys are able to work with each other').toBe(message)
      expect(httpClientSpy.post.calls.count()).withContext('One request for exchanging public keys').toBe(1)
      done()
    })
  });

  it('#encrypt encrypt message using stored server public key', (done: DoneFn) => {
    expect(() => { cryptoService.encrypt(message) }).toThrowError('Missing server public key.')
    sessionStorage.setItem('serverPublicJwkStr', JSON.stringify(mockPublicJwk))
    cryptoService.encrypt(message).subscribe(async encrypted => {
      const decrypted = await window.crypto.subtle.decrypt(cryptoService.rsa, mockKeyPair.privateKey, encrypted)
      const decoded = new TextDecoder().decode(decrypted)
      expect(decoded).toBe(message)
      done()
    })
  })

  it('#decrypt decrypt message using stored client private key', async () => {
    const encrypted = await window.crypto.subtle.encrypt(cryptoService.rsa, mockKeyPair.publicKey, encoded)
    expect(() => { cryptoService.decrypt(encrypted) }).toThrowError('Missing client private key.')
    sessionStorage.setItem('clientPrivateJwkStr', JSON.stringify(mockPrivateJwk))
    cryptoService.decrypt(encrypted).subscribe(decoded => {
      expect(decoded).toBe(message)
    })
  })
});

