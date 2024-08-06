import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CapsLockDetectDirective } from '../shared/caps-lock-detect.directive';
import { AuthenticationService, LoginInfo } from '../../shared/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgOptimizedImage,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    CapsLockDetectDirective,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  authService = inject(AuthenticationService)
  breakpointObserver = inject(BreakpointObserver)
  formWidth = ''
  showPassword = signal(false)
  capsLockState = false

  loginForm = new FormGroup({
    account: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
    keepLogin: new FormControl(false)
  })

  constructor() {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.XLarge,
      ])
      .subscribe(state => {
        if (state.breakpoints[Breakpoints.XSmall]) this.formWidth = '70%';
        else if (state.breakpoints[Breakpoints.Small]) this.formWidth = '50%';
        else if (state.breakpoints[Breakpoints.Medium]) this.formWidth = '30%';
        else if (state.breakpoints[Breakpoints.Large]) this.formWidth = '25%';
        else if (state.breakpoints[Breakpoints.XLarge]) this.formWidth = '20%';
      })

    this.loginForm.setValue({
      account: 'hieuho0103',
      password: 'Hello123#',
      keepLogin: true,
    })
  }

  login() {
    this.loginForm.markAllAsTouched()
    if (this.loginForm.valid) {
      const { account, password, keepLogin } = this.loginForm.value

      if (account && password) {
        const loginInfo: LoginInfo = { account, password, keepLogin }
        this.authService.login(loginInfo)
      }
    }
  }

  togglePassword(event: MouseEvent) {
    this.showPassword.set(!this.showPassword())
    event.stopPropagation()
  }
}
