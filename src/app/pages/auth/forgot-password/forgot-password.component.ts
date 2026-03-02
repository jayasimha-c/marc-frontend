import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  standalone: false,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  sent = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private message: NzMessageService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }

    this.loading = true;
    this.authService.forgotPassword(this.form.value.username, this.form.value.email).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.sent = true;
          this.message.success('Password reset instructions sent to your email.');
        }
      },
      error: () => {
        this.loading = false;
        this.message.error('Failed to send reset instructions.');
      },
    });
  }
}
