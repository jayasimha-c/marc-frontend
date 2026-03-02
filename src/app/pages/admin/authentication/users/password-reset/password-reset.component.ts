import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthenticationMgmtService } from '../../authentication.service';
import { FormValidationService } from '../../../../../core/services/form-validation.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { PasswordService } from '../../../../../core/services/password.service';

@Component({
  standalone: false,
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss'],
})
export class PasswordResetComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  form: FormGroup;
  user: any;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private authService: AuthenticationMgmtService,
    private fb: FormBuilder,
    private formValidation: FormValidationService,
    private notificationService: NotificationService,
    private passwordService: PasswordService,
    public modal: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.user = this.dialogData.user;
    this.form = this.fb.group({
      id: [this.user.id, [Validators.required]],
      username: new FormControl({ value: this.user.username, disabled: true }, Validators.required),
      newPassword: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      confirmPassword: ['', [
        Validators.required, Validators.minLength(5), Validators.maxLength(20),
        this.passwordService.matchValues('newPassword'),
      ]],
    });
  }

  updatePassword(): void {
    this.authService.updatePassword(this.form.getRawValue())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (resp.success) {
            this.notificationService.show(resp);
            this.modal.close(true);
          }
        },
        error: (err) => {
          this.formValidation.validateAllFields(this.form, err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
