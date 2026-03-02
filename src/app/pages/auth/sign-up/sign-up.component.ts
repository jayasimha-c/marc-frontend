import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
    standalone: false,
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html'
})
export class SignUpComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.form = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            company: [''],
            agreements: [false, Validators.requiredTrue],
        });
    }

    submit(): void {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
            return;
        }

        this.loading = true;
        this.authService.signUp(this.form.value).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigateByUrl('/auth/confirmation-required');
            },
            error: () => {
                this.loading = false;
                this.message.error('Something went wrong, please try again.');
            }
        });
    }
}
