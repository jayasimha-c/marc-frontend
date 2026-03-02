import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FormValidationService {
  validateAllFields(formGroup: FormGroup, error: HttpErrorResponse): void {
    if (error.status !== 400) {
      return;
    }
    const errors = error.error.data;
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control instanceof FormControl && errors[field] !== undefined) {
        control.updateValueAndValidity();
        control.setErrors({ serverError: errors[field] });
      } else if (control instanceof FormGroup) {
        this.validateAllFields(control, error);
      }
    });
  }

  markGroupDirty(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markGroupDirty(control);
      } else if (control instanceof FormArray) {
        this.markArrayDirty(control);
      } else if (control instanceof FormControl) {
        control.markAsDirty();
      }
    });
  }

  markArrayDirty(formArray: FormArray): void {
    formArray.controls.forEach(control => {
      if (control instanceof FormGroup) {
        this.markGroupDirty(control);
      } else if (control instanceof FormArray) {
        this.markArrayDirty(control);
      } else if (control instanceof FormControl) {
        control.markAsDirty();
      }
    });
  }
}
