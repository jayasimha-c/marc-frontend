import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CamService } from '../../../cam.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ApiResponse } from '../../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-add-user-provision-field',
  templateUrl: './add-user-provision-field.component.html',
})
export class AddUserProvisionFieldComponent {
  fields: string[] = [];
  form: FormGroup;
  isEdit: boolean;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modalRef: NzModalRef,
    private fb: FormBuilder,
    private camService: CamService,
    private notificationService: NotificationService,
  ) {
    this.fields = this.dialogData.fields || [];
    this.isEdit = this.dialogData.action === 'edit';

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      isActive: [false],
    });

    if (this.isEdit && this.dialogData.data) {
      this.form.patchValue({
        name: this.dialogData.data.fieldName || '',
        description: this.dialogData.data.fieldDesc || '',
        isActive: this.dialogData.data.active || false,
      });
    }
  }

  save(): void {
    Object.values(this.form.controls).forEach(c => {
      c.markAsDirty();
      c.updateValueAndValidity();
    });

    if (!this.form.valid) return;

    const payload: any = {
      fieldName: this.form.value.name,
      fieldDesc: this.form.value.description,
      active: this.form.value.isActive,
    };

    if (this.isEdit) {
      payload.id = this.dialogData.data?.id;
    }

    this.camService.provisionUserFieldAddEdit(payload, this.dialogData.action).subscribe({
      next: (resp: ApiResponse) => {
        this.notificationService.success(resp.message || 'Saved successfully');
        this.modalRef.close(true);
      },
      error: ({ error }) => {
        this.notificationService.error(error?.message || 'Save failed');
      },
    });
  }
}
