import { Directive } from '@angular/core';
import { AbstractControl, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';

export const passwordConfirmationValidator: ValidatorFn = (control: AbstractControl,): ValidationErrors | null => {
  const password = control.get('password');
  const passwordConfirmation = control.get('passwordConfirmation');

  return password?.value !== passwordConfirmation?.value ? { passwordConfirmation: true } : null;
}

@Directive({
  selector: '[appPasswordConfirmation]',
  standalone: true,
})
export class PasswordConfirmationDirective implements Validator {

  validate(control: AbstractControl): ValidationErrors | null {
    return passwordConfirmationValidator(control);
  }
}
