import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class PasswordService {
  matchValues(matchTo: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }
      const matchControl = control.parent.get(matchTo);
      return matchControl && control.value === matchControl.value
        ? null
        : { isMatching: false };
    };
  }
}
