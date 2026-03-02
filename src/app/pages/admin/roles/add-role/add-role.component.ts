import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { Subject, takeUntil } from 'rxjs';
import { RoleService } from '../role.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormValidationService } from '../../../../core/services/form-validation.service';

@Component({
  standalone: false,
  selector: 'app-add-role',
  templateUrl: './add-role.component.html',
})
export class AddRoleComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  loading = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private formValidation: FormValidationService,
    public modal: NzModalRef,
  ) {
    this.form = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(4)]],
      roleDescription: ['', [Validators.required, Validators.minLength(2)]],
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    this.loading = true;
    this.roleService
      .store(this.form.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.loading = false;
          this.notificationService.show(resp);
          this.modal.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.formValidation.validateAllFields(this.form, err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
