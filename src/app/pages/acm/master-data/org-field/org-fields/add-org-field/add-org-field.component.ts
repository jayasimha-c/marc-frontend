import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { OrgFieldService } from '../../org-field.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-org-field',
  templateUrl: './add-org-field.component.html',
})
export class AddOrgFieldComponent implements OnInit {
  form!: FormGroup;
  formType: string;
  sapSystemList: any[] = [];
  isSaving = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    private orgFieldService: OrgFieldService,
    private notificationService: NotificationService,
    public modal: NzModalRef,
  ) {
    this.formType = this.dialogData.formType;
    this.form = this.fb.group({
      sapSystem: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      isActive: [false],
    });

    if (this.formType === 'Edit' && this.dialogData.data) {
      this.form.patchValue({
        sapSystem: this.dialogData.data.sapSystemId,
        name: this.dialogData.data.fieldName,
        description: this.dialogData.data.description,
        isActive: this.dialogData.data.active,
      });
    }
  }

  ngOnInit(): void {
    this.orgFieldService.getSAPSystems().subscribe({
      next: (res) => { this.sapSystemList = res.data || []; },
      error: () => { this.sapSystemList = []; },
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving = true;
    const oper = this.formType === 'Edit' ? 'edit' : 'add';
    const payload: any = {
      sapSystemId: this.form.get('sapSystem')!.value,
      fieldName: this.form.get('name')!.value,
      description: this.form.get('description')!.value,
      active: this.form.get('isActive')!.value,
    };

    if (this.formType === 'Edit' && this.dialogData.data) {
      payload.id = this.dialogData.data.id;
    }

    this.orgFieldService.addOrEditOrgField(oper, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success) {
          this.notificationService.success('Saved successfully');
          this.modal.close(true);
        } else {
          this.notificationService.error(res.message || 'Save failed');
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.error(err.error?.message || 'Save failed');
      },
    });
  }
}
