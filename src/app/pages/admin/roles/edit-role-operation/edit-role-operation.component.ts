import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { TransferItem } from 'ng-zorro-antd/transfer';
import { RoleService } from '../role.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FormValidationService } from '../../../../core/services/form-validation.service';

@Component({
  standalone: false,
  selector: 'app-edit-role-operation',
  templateUrl: './edit-role-operation.component.html',
})
export class EditRoleOperationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  form!: FormGroup;
  form$!: Observable<FormGroup>;
  transferList: TransferItem[] = [];
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
    const role = this.dialogData.role;
    this.form$ = this.roleService.initEditRoleOperationForm(role.id).pipe(
      map((resp) => {
        const allOperations: any[] = resp.data.operations || [];
        const assignedIds: number[] = resp.data.role?.operationIds || [];

        this.transferList = allOperations.map((op: any) => ({
          key: String(op.id),
          title: op.operationName,
          direction: assignedIds.includes(op.id) ? 'right' : 'left',
        } as TransferItem));

        this.form = this.fb.group({
          id: [role.id],
          roleName: [{ value: role.roleName, disabled: true }],
        });
        return this.form;
      })
    );
  }

  save(): void {
    this.loading = true;
    const data = {
      id: this.dialogData.role.id,
      operationIds: this.transferList
        .filter((item) => item.direction === 'right')
        .map((item) => Number(item.key)),
    };

    this.roleService
      .updateRoleOperations(data)
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
