import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { E2EE_ENABLED } from './key-checking.interceptor';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

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
  router = inject(Router)
  http = inject(HttpClient)
  baseUrl = 'http://localhost:3000/authentication/'
  options = { context: new HttpContext().set(E2EE_ENABLED, true) }

  constructor() { }

  signup(account: SignupInfo) {
    this.http.post(this.baseUrl + 'signup', account, this.options)
      .subscribe(res => {
        console.log(res)
        sessionStorage.setItem('account', JSON.stringify(res))
        this.router.navigate(['home'])
      })
  }

  login(loginInfo: LoginInfo) {
    this.http.post(this.baseUrl + 'login', loginInfo, this.options)
      .subscribe({
        next: (res) => {
          console.log(res)
          if (loginInfo.keepLogin) localStorage.setItem('account', JSON.stringify(res))
          else sessionStorage.setItem('account', JSON.stringify(res))
          this.router.navigate(['home'])
        },
        error: (err) => {
          console.log(err)
        }
      })
  }

  logout() {
    this.http.post(this.baseUrl + 'logout', null, { withCredentials: true, responseType: 'text' }).subscribe(res => {
      console.log(res)
      sessionStorage.clear()
      localStorage.clear()
      this.router.navigate(['login'])
    })
  }

  isLogedIn(): Observable<boolean> {
    return this.http.get<boolean>(this.baseUrl + 'isLogedIn', { withCredentials: true })
  }
}
