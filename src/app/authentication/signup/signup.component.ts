import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

import { passwordConfirmationValidator } from '../shared/password-confirmation.directive';
import { CapsLockDetectDirective } from '../shared/caps-lock-detect.directive';
import { AuthenticationService, IAccount } from '../shared/authentication.service';

@Component({
  selector: 'app-signup',
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
    MatTooltip,
    CapsLockDetectDirective
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  breakpointObserver = inject(BreakpointObserver)
  authService = inject(AuthenticationService)
  formWidth = ''
  showPassword = signal(false)
  passwordHint = 'Password must have at least:\n- 1 lowercase character\n- 1 uppercase character\n- 1 special character\n- 1 number'
  capsLockState = false
  isPasswordFocus = false
  isConfirmationFocus = false
  showAgreementError = false

  signupForm = new FormGroup({
    username: new FormControl('', [
      Validators.minLength(8),
      Validators.maxLength(24),
      Validators.required,
      Validators.pattern('[a-zA-Z0-9]*')
    ]),
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', [
      Validators.minLength(8),
      Validators.maxLength(24),
      Validators.required,
      Validators.pattern('^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z0-9@$!%*#?&]*$')
    ]),
    passwordConfirmation: new FormControl('', [
      Validators.minLength(8),
      Validators.maxLength(24),
      Validators.required,
    ]),
    policyAgreement: new FormControl(false, Validators.requiredTrue)
  }, { validators: passwordConfirmationValidator })

  get password() {
    return this.signupForm.get('password')
  }

  get confirmation() {
    return this.signupForm.get('passwordConfirmation')
  }

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

    this.signupForm.setValue({
      username: 'hieuho0103',
      email: 'hieuho@gmail.com',
      password: 'Hello123#',
      passwordConfirmation: 'Hello123#',
      policyAgreement: true
    })
  }

  togglePassword(event: MouseEvent) {
    this.showPassword.set(!this.showPassword())
    event.stopPropagation()
  }

  openPolicies(event: MouseEvent) {
    let url = '/'
    window.open(url)
    event.preventDefault()
  }

  shouldShowError(controlName: string) {
    const control = this.signupForm.get(controlName)
    const isControlEdited = control?.invalid && (control.dirty || control.touched);

    switch (controlName) {
      case 'username':
      case 'email':
      case 'password':
      case 'policyAgreement':
        return isControlEdited;
      case 'passwordConfirmation':
        return isControlEdited || this.signupForm.hasError('passwordConfirmation');
      default:
        return false;
    }
  }

  getErrorMessages(controlName: string) {
    const control = this.signupForm.get(controlName)
    let errorMessages = []

    switch (controlName) {
      case 'username':
        if (control?.hasError('required'))
          errorMessages.push('Username is required')
        else if (control?.hasError('minlength') || control?.hasError('maxlength'))
          errorMessages.push('Username should be 8 to 24 characters')
        else if (control?.hasError('pattern'))
          errorMessages.push('Username cannot contain special characters')
        break;

      case 'email':
        if (control?.hasError('required'))
          errorMessages.push('Email is required')
        else if (control?.hasError('email'))
          errorMessages.push('Email format is not valid')
        break;

      case 'password':
        if (control?.hasError('required'))
          errorMessages.push('Password is required')
        else if (control?.hasError('minlength') || control?.hasError('maxlength'))
          errorMessages.push('Password should be 8 to 24 characters')
        else if (control?.hasError('pattern'))
          errorMessages.push('Invalid password')
        break;

      case 'passwordConfirmation':
        if (control?.hasError('required'))
          errorMessages.push('Reenter your password')
        else if (control?.hasError('minlength') || control?.hasError('maxlength')) {
          errorMessages.push('Password should be 8 to 24 characters')
        }
        else if (this.signupForm.hasError('passwordConfirmation')) {
          control?.setErrors({ notMatch: true })
          errorMessages.push('Password does not match')
        }
        break;

      default: break;
    }

    return errorMessages
  }

  signup() {
    this.signupForm.markAllAsTouched()
    if (this.signupForm.valid) {

      // const email = this.signupForm.value.email
      // const username = this.signupForm.value.username
      // const password = this.signupForm.value.password
      const { email, username, password } = this.signupForm.value

      if (email && username && password) {
        const acc: IAccount = { email, username, password }
        this.authService.signup(acc)
      }

    }
  }
}
