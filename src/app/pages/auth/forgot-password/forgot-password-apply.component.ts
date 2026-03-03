import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  standalone: false,
  selector: 'app-forgot-password-apply',
  templateUrl: './forgot-password-apply.component.html',
})
export class ForgotPasswordApplyComponent implements OnInit {
  isProcessing = false;
  tokenProcessed = false;
  alertType: 'success' | 'error' = 'success';
  alertMessage = '';

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.applyToken(token);
      } else {
        this.tokenProcessed = true;
        this.alertType = 'error';
        this.alertMessage = 'Invalid password reset link. Please request a new password reset.';
      }
    });
  }

  private applyToken(token: string): void {
    this.isProcessing = true;
    this.authService.applyResetPasswordToken(token).pipe(
      finalize(() => {
        this.isProcessing = false;
        this.tokenProcessed = true;
      })
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertType = 'success';
          this.alertMessage = response.message || 'Password reset successful! A temporary password has been sent to your email.';
        } else {
          this.alertType = 'error';
          this.alertMessage = response.message || 'Invalid or expired reset token. Please request a new password reset.';
        }
      },
      error: (error) => {
        this.alertType = 'error';
        this.alertMessage = error?.error?.message || 'An error occurred while resetting your password. Please try again.';
      }
    });
  }
}
