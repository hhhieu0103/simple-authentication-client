import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { E2EE_ENABLED } from '../../shared/key-checking.interceptor';

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
    this.http.post(this.baseUrl + 'signup', account, this.options)
      .subscribe(res => {
        console.log(res)
      })
  }

  login(loginInfo: LoginInfo) {
    this.http.post(this.baseUrl + 'login', loginInfo, this.options)
      .subscribe((res) => {

      })
  }
}
