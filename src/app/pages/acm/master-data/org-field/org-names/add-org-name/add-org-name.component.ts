import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { OrgFieldService } from '../../org-field.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-org-name',
  templateUrl: './add-org-name.component.html',
})
export class AddOrgNameComponent {
  form!: FormGroup;
  isSaving = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private fb: FormBuilder,
    private orgFieldService: OrgFieldService,
    private notificationService: NotificationService,
    public modal: NzModalRef,
  ) {
    this.form = this.fb.group({
      orgName: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving = true;
    this.orgFieldService.addOrgName({
      name: this.form.get('orgName')!.value,
      description: this.form.get('description')!.value,
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.notificationService.success('Saved successfully');
        this.modal.close(true);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.error(err.error?.message || 'Save failed');
      },
    });
  }
}
