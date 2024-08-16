import { TestBed } from '@angular/core/testing';

import { CookieService } from './cookie.service';

describe('CookieService', () => {
  let service: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CookieService);
  });

  it('#getCookie should return cookie or null', () => {
    let cookie = service.getCookie('serverPublicKey')
    expect(cookie).toBeNull()
    document.cookie = "serverPublicKey=Server Public Key"
    cookie = service.getCookie('serverPublicKey')
    expect(cookie).toBe('Server Public Key')
    service.deleteCookie('serverPublicKey')
  });

  it('#deleteCookie should delete cookie if exists', () => {
    document.cookie = "serverPublicKey=Server Public Key"
    let cookie = service.getCookie('serverPublicKey')
    expect(cookie).toBe('Server Public Key')
    service.deleteCookie('serverPublicKey')
    cookie = service.getCookie('serverPublicKey')
    expect(cookie).toBeNull()
  })
});
