import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { E2EE_ENABLED } from '../../shared/key-checking.interceptor';

export interface IAccount {
  username: string,
  email: string,
  password: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  http = inject(HttpClient)
  baseUrl = 'http://localhost:3000/authentication/'

  constructor() { }

  signup(account: IAccount) {
    this.http.post(
      this.baseUrl + 'signup', account,
      { context: new HttpContext().set(E2EE_ENABLED, true) }
    ).subscribe(res => {
      console.log(res)
    })
  }
}
