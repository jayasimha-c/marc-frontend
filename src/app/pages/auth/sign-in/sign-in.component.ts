import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  standalone: false,
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  signInForm!: FormGroup;
  licenseForm!: FormGroup;
  passwordResetForm!: FormGroup;

  loading = false;
  reportingUnits: any[] = [];
  showReportingUnits = false;
  passwordVisible = false;

  license: any = null;
  isLicenseValid = true;
  licenseMessage = '';
  isLoadingLicense = false;
  showPasswordReset = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      reportingUnit: [''],
      remember: [true],
    });

    this.licenseForm = this.fb.group({
      licenseKey: ['', [Validators.required]],
    });

    this.passwordResetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });

    this.checkLicense();
  }

  checkLicense(): void {
    this.isLoadingLicense = true;
    this.authService.getLicense().subscribe({
      next: (response: any) => {
        this.isLoadingLicense = false;
        if (response.success && response.data) {
          this.license = response.data;
          this.isLicenseValid = this.license.status === 'LICENSE_VALID';
          if (!this.isLicenseValid) {
            this.licenseMessage = `License validation failed with status: ${this.license.status}`;
          }
        } else {
          this.isLicenseValid = false;
          this.licenseMessage = response.message || 'No license file found!';
        }
      },
      error: () => {
        this.isLoadingLicense = false;
        this.isLicenseValid = false;
        this.licenseMessage = 'Unable to verify license. Please check backend connection or enter your license key.';
      }
    });
  }

  applyLicense(): void {
    if (this.licenseForm.invalid) {
      Object.values(this.licenseForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      return;
    }

    this.loading = true;
    const licenseKey = this.licenseForm.get('licenseKey')?.value;

    this.authService.applyLicense(licenseKey).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.message.success(response.message || 'License key was applied successfully');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          this.message.error(response.message || 'Failed to apply license');
        }
      },
      error: (error) => {
        this.loading = false;
        this.message.error(error?.error?.message || error.message || 'Failed to apply license');
      }
    });
  }

  submitPasswordReset(): void {
    if (this.passwordResetForm.invalid) {
      Object.values(this.passwordResetForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      return;
    }

    if (this.passwordResetForm.value.newPassword !== this.passwordResetForm.value.confirmPassword) {
      this.message.error("Passwords don't match");
      return;
    }

    this.loading = true;
    this.authService.resetPasswordInitial(
      this.signInForm.value.username,
      this.passwordResetForm.value.newPassword,
      this.passwordResetForm.value.confirmPassword
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.message.success("Password reset successful! Signing in...");
          this.authService.signOut().subscribe(() => {
            setTimeout(() => {
              this.signInForm.patchValue({ password: this.passwordResetForm.value.newPassword });
              this.showPasswordReset = false;
              this.signIn();
            }, 1000);
          });
        } else {
          this.loading = false;
          this.message.error(response.message || "Password reset failed");
        }
      },
      error: (error) => {
        this.loading = false;
        this.message.error(error?.error?.message || "An error occurred while resetting password");
      }
    });
  }

  checkReportingUnits(): void {
    const { username, password } = this.signInForm.value;
    if (!username || !password) {
      return;
    }

    this.loading = true;
    this.authService.reportingUnits({ username, password }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data?.length > 1) {
          this.reportingUnits = response.data;
          this.showReportingUnits = true;
        } else {
          this.signIn();
        }
      },
      error: () => {
        this.loading = false;
        this.signIn();
      },
    });
  }

  signIn(): void {
    if (this.signInForm.invalid) {
      Object.values(this.signInForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity();
        }
      });
      return;
    }

    this.loading = true;
    const credentials = {
      username: this.signInForm.value.username,
      password: this.signInForm.value.password,
      ...(this.signInForm.value.reportingUnit ? { reportingUnit: this.signInForm.value.reportingUnit } : {}),
    };

    this.authService.signIn(credentials).subscribe({
      next: (response: any) => {
        if (response?.data?.initial) {
          this.loading = false;
          this.showPasswordReset = true;
          this.message.info("Please reset your password to continue");
          return;
        }

        this.loading = false;
        const redirectURL = this.route.snapshot.queryParamMap.get('redirectURL') || '/landing';
        this.router.navigateByUrl(redirectURL);
      },
      error: (error) => {
        this.loading = false;
        this.message.error(error?.error?.message || 'Sign in failed. Please check your credentials.');
      },
    });
  }
}
