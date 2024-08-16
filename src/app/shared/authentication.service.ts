import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { E2EE_ENABLED } from './key-checking.interceptor';
import { Observable, tap } from 'rxjs';

export interface SignupInfo {
  username: string,
  email: string,
  password: string
}

export interface LoginInfo {
  account: string,
  password: string,
  keepLogin?: boolean | null
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  http = inject(HttpClient)
  baseUrl = 'http://localhost:3000/authentication/'
  options = { context: new HttpContext().set(E2EE_ENABLED, true) }

  constructor() { }

  signup(account: SignupInfo) {
    return this.http.post(this.baseUrl + 'signup', account, this.options)
      .pipe(
        tap(res => {
          sessionStorage.setItem('account', JSON.stringify(res))
        })
      )
  }

  login(loginInfo: LoginInfo) {
    return this.http.post(this.baseUrl + 'login', loginInfo, this.options)
      .pipe(
        tap(res => {
          if (loginInfo.keepLogin) localStorage.setItem('account', JSON.stringify(res))
          else sessionStorage.setItem('account', JSON.stringify(res))
        })
      )
  }

  logout() {
    return this.http.post(this.baseUrl + 'logout', null, { withCredentials: true, responseType: 'text' })
      .pipe(
        tap(res => {
          sessionStorage.clear()
          localStorage.clear()
        })
      )
  }

  isLogedIn(): Observable<boolean> {
    return this.http.get<boolean>(this.baseUrl + 'isLogedIn', { withCredentials: true })
  }
}
