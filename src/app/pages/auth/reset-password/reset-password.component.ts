import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
    standalone: false,
    selector: 'app-reset-password',
    templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    hidePassword = true;
    hidePasswordConfirm = true;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(8)]],
            passwordConfirm: ['', Validators.required],
        });
    }

    submit(): void {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
            return;
        }

        if (this.form.value.password !== this.form.value.passwordConfirm) {
            this.message.error("Passwords don't match");
            return;
        }

        this.loading = true;
        this.authService.resetPassword(this.form.value.password).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.success || res) {
                    this.message.success('Password updated successfully. Please sign in with your new password.');
                    this.router.navigateByUrl('/sign-in');
                } else {
                    this.message.error(res.message || 'Failed to reset password.');
                }
            },
            error: () => {
                this.loading = false;
                this.message.error('Something went wrong, please try again.');
            }
        });
    }
}
