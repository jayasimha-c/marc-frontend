import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
    standalone: false,
    selector: 'app-unlock-session',
    templateUrl: './unlock-session.component.html'
})
export class UnlockSessionComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    hidePassword = true;
    name = '';
    private email = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private userService: UserService,
        private router: Router,
        private route: ActivatedRoute,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.userService.user$.subscribe(user => {
            if (user) {
                this.name = user.name || user.username;
                this.email = user.email;
            }
        });

        this.form = this.fb.group({
            name: [{ value: this.name, disabled: true }],
            password: ['', Validators.required],
        });
    }

    submit(): void {
        if (this.form.invalid) {
            Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
            return;
        }

        this.loading = true;
        this.authService.unlockSession({
            email: this.email,
            password: this.form.value.password,
        }).subscribe({
            next: () => {
                this.loading = false;
                const redirectURL = this.route.snapshot.queryParamMap.get('redirectURL') || '/landing';
                this.router.navigateByUrl(redirectURL);
            },
            error: () => {
                this.loading = false;
                this.message.error('Invalid password.');
                this.form.get('password')?.reset();
            }
        });
    }
}
