import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  standalone: false,
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit, OnDestroy {
  signInForm!: FormGroup;
  licenseForm!: FormGroup;
  passwordResetForm!: FormGroup;

  loading = false;
  reportingUnits: any[] = [];
  showReportingUnits = false;
  passwordVisible = false;
  newPasswordVisible = false;
  confirmPasswordVisible = false;

  license: any = null;
  isLicenseValid = true;
  licenseMessage = '';
  isLoadingLicense = false;
  showPasswordReset = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      reportingUnit: [''],
      remember: [false],
    });

    this.licenseForm = this.fb.group({
      licenseKey: ['', [Validators.required]],
    });

    this.passwordResetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });

    // Clear session
    sessionStorage.clear();

    // Check license
    this.checkLicense();

    // Restore remembered username
    this.loadRememberedUser();

    // Auto-focus username
    setTimeout(() => {
      const el = document.querySelector('input[formcontrolname="username"]') as HTMLInputElement;
      el?.focus();
    }, 200);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -- Remember me --

  private loadRememberedUser(): void {
    const remembered = localStorage.getItem('remembered_user');
    if (remembered) {
      this.signInForm.patchValue({ username: remembered, remember: true });
    }
  }

  private saveRememberedUser(): void {
    if (this.signInForm.value.remember) {
      localStorage.setItem('remembered_user', this.signInForm.value.username);
    } else {
      localStorage.removeItem('remembered_user');
    }
  }

  // -- License --

  checkLicense(): void {
    this.isLoadingLicense = true;
    this.authService.getLicense().pipe(takeUntil(this.destroy$)).subscribe({
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
      this.markDirty(this.licenseForm);
      return;
    }

    this.loading = true;
    this.authService.applyLicense(this.licenseForm.get('licenseKey')?.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.message.success(response.message || 'License key was applied successfully');
            setTimeout(() => window.location.reload(), 1000);
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

  // -- Password reset (initial login) --

  submitPasswordReset(): void {
    if (this.passwordResetForm.invalid) {
      this.markDirty(this.passwordResetForm);
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
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.message.success('Password reset successful! Signing in...');
          this.authService.signOut().subscribe(() => {
            setTimeout(() => {
              this.signInForm.patchValue({ password: this.passwordResetForm.value.newPassword });
              this.showPasswordReset = false;
              this.signIn();
            }, 1000);
          });
        } else {
          this.loading = false;
          this.message.error(response.message || 'Password reset failed');
        }
      },
      error: (error) => {
        this.loading = false;
        this.message.error(error?.error?.message || 'An error occurred while resetting password');
      }
    });
  }

  // -- Reporting units --

  checkReportingUnits(): void {
    const { username, password } = this.signInForm.value;
    if (!username || !password) return;

    this.loading = true;
    this.authService.reportingUnits({ username, password })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  // -- Sign in --

  signIn(): void {
    if (this.signInForm.invalid) {
      this.markDirty(this.signInForm);
      return;
    }

    this.saveRememberedUser();
    this.loading = true;

    const credentials = {
      username: this.signInForm.value.username,
      password: this.signInForm.value.password,
      ...(this.signInForm.value.reportingUnit ? { reportingUnit: this.signInForm.value.reportingUnit } : {}),
    };

    this.authService.signIn(credentials).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response?.data?.initial) {
          this.loading = false;
          this.showPasswordReset = true;
          this.message.info('Please reset your password to continue');
          return;
        }

        // Store login time for sign-out session summary
        sessionStorage.setItem('loginTime', new Date().toISOString());

        this.loading = false;
        const redirectURL = this.route.snapshot.queryParamMap.get('redirectURL') || '/landing';
        this.router.navigateByUrl(redirectURL);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.signInForm.patchValue({ password: '' });
        this.message.error(this.getErrorMessage(error));
      },
    });
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 401: return 'Invalid username or password. Please try again.';
      case 403: return 'Your account has been locked. Please contact administrator.';
      case 429: return 'Too many login attempts. Please wait and try again.';
      case 500: return 'Server error occurred. Please try again later.';
      case 0:   return 'Unable to connect to server. Please check your connection.';
      default:  return error.error?.message || 'An unexpected error occurred. Please try again.';
    }
  }

  private markDirty(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });
  }
}
