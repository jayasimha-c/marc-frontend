import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { formatDate } from '@angular/common';
import { CamService } from '../../../cam.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-add-approval-delegation',
  templateUrl: './add-approval-delegation.component.html',
})
export class AddApprovalDelegationComponent {
  formType: string;
  userList: [string, string][] = [];
  form: FormGroup;

  get isAdmin(): boolean {
    return this.formType === 'add-with-admin' || this.formType === 'edit-with-admin';
  }

  get isEdit(): boolean {
    return this.formType === 'edit' || this.formType === 'edit-with-admin';
  }

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modalRef: NzModalRef,
    private fb: FormBuilder,
    private camService: CamService,
    private notificationService: NotificationService,
  ) {
    this.formType = this.dialogData.formType;
    this.form = this.fb.group({
      delegator: [''],
      assignTo: ['', [Validators.required]],
      validFrom: [null, [Validators.required]],
      validTo: [null, [Validators.required]],
      isCAMApprover: [false],
      isPAMApprover: [false],
      isPAMReviewer: [false],
      isActive: [false],
    });

    if (this.isAdmin) {
      this.form.get('delegator')!.setValidators([Validators.required]);
      this.form.get('delegator')!.updateValueAndValidity();
    }

    this.loadInfo();
  }

  save(): void {
    Object.values(this.form.controls).forEach(c => {
      c.markAsDirty();
      c.updateValueAndValidity();
    });

    if (!this.form.valid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    const payload: any = {
      assigner: this.form.value.assignTo,
      validFromStr: formatDate(this.form.value.validFrom, 'dd/MM/yyyy HH:mm:ss', 'en-US'),
      validToStr: formatDate(this.form.value.validTo, 'dd/MM/yyyy HH:mm:ss', 'en-US'),
      camApprover: this.form.value.isCAMApprover,
      pamApprover: this.form.value.isPAMApprover,
      pamReviewer: this.form.value.isPAMReviewer,
      active: this.form.value.isActive,
    };

    if (this.isAdmin) {
      payload.delegator = this.form.value.delegator;
      payload.admin = true;
    }

    if (this.isEdit) {
      payload.id = this.dialogData.id;
    }

    this.camService.saveDelegate(payload).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.success(resp.message || 'Saved successfully');
          this.modalRef.close(true);
        } else {
          this.notificationService.error(resp.message || 'Save failed');
        }
      },
      error: ({ error }) => {
        this.notificationService.error(error?.message || 'An error occurred');
      },
    });
  }

  private loadInfo(): void {
    this.camService.getDelegateInfo({
      admin: this.isAdmin,
      edit: this.isEdit,
      id: this.isEdit ? this.dialogData.id : undefined,
    }).subscribe((resp: ApiResponse) => {
      this.userList = Object.entries(resp.data?.userMap || {}) as [string, string][];

      if (this.isEdit && this.dialogData.data) {
        const d = this.dialogData.data;
        this.form.patchValue({
          delegator: d.delegator?.toString() || '',
          assignTo: d.assigner?.toString() || '',
          validFrom: d.validFrom ? new Date(parseInt(d.validFrom, 10)) : null,
          validTo: d.validTo ? new Date(parseInt(d.validTo, 10)) : null,
          isCAMApprover: d.camApprover,
          isPAMApprover: d.pamApprover,
          isPAMReviewer: d.pamReviewer,
          isActive: d.active,
        });
      }
    });
  }
}
