import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { RoleService } from '../role.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormValidationService } from '../../../../core/services/form-validation.service';

@Component({
  standalone: false,
  selector: 'app-edit-role',
  templateUrl: './edit-role.component.html',
})
export class EditRoleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  form!: FormGroup;
  form$!: Observable<FormGroup>;
  loading = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    private roleService: RoleService,
    private notificationService: NotificationService,
    private formValidation: FormValidationService,
    public modal: NzModalRef,
  ) {}

  ngOnInit(): void {
    this.form$ = this.roleService.initDataForEdit(this.dialogData.roleId).pipe(
      map((resp) => {
        this.form = this.fb.group({
          id: [resp.data.id],
          roleName: [{ value: resp.data.roleName, disabled: true }, [Validators.required, Validators.minLength(4)]],
          roleDescription: [resp.data.roleDescription, [Validators.required, Validators.minLength(2)]],
        });
        return this.form;
      })
    );
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    this.loading = true;
    this.form.controls['roleName'].enable();
    this.roleService
      .update(this.form.value)
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
