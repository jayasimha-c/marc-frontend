import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthenticationMgmtService } from '../../authentication.service';
import { FormValidationService } from '../../../../../core/services/form-validation.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PasswordService } from '../../../../../core/services/password.service';
import { ApiResponse } from '../../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss'],
})
export class AddUserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  form: FormGroup;
  user: any;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private authService: AuthenticationMgmtService,
    private passwordService: PasswordService,
    private fb: FormBuilder,
    private formValidation: FormValidationService,
    private notificationService: NotificationService,
    public modal: NzModalRef,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.pattern('[a-zA-Z]*')]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.pattern('[a-zA-Z]*')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20), this.passwordService.matchValues('password')]],
      enabled: [true, Validators.required],
      initial: [true],
    });
  }

  ngOnInit(): void {
    this.user = this.dialogData.user;
    if (this.user) {
      this.form.patchValue({
        username: this.user.username,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        enabled: this.user.enabled,
        password: '',
        confirmPassword: '',
        initial: true,
      });
    }
  }

  createUser(): void {
    this.authService.save(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          this.notificationService.show(resp);
          if (resp.success) {
            this.modal.close(true);
          }
        },
        error: (error) => {
          this.notificationService.error(error?.error?.message || 'Save failed');
          this.formValidation.validateAllFields(this.form, error);
          this.form.markAllAsTouched();
        },
      });
  }

  updateUser(): void {
    const payload = { ...this.form.value, id: this.user.id };
    const oper = this.dialogData.formType === 'Edit' ? 'edit' : 'add';
    this.authService.update(oper, this.user.id, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          this.notificationService.show(resp);
          if (resp.success) {
            this.modal.close(true);
          }
        },
        error: (error) => {
          this.notificationService.error(error?.error?.message || 'Update failed');
          this.formValidation.validateAllFields(this.form, error);
          this.form.markAllAsTouched();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
