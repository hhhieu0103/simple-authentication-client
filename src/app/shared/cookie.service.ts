import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CookieService {

  constructor() { }

  getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookie = parts.pop()?.split(';').shift();
      if (cookie) return decodeURIComponent(cookie)
    }
    return null
  }

  deleteCookie(name: string) {
    if (this.getCookie(name)) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT"
    }
  }
}
