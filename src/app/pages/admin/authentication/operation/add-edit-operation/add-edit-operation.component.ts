import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { AuthenticationMgmtService } from '../../authentication.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { FormValidationService } from '../../../../../core/services/form-validation.service';

@Component({
  standalone: false,
  selector: 'app-add-edit-operation',
  templateUrl: './add-edit-operation.component.html',
  styleUrls: ['./add-edit-operation.component.scss'],
})
export class AddEditOperationComponent implements OnInit {
  loading = false;
  formType = '';
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationMgmtService,
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private notificationService: NotificationService,
    public modal: NzModalRef,
    private formValidation: FormValidationService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      operationName: ['', [Validators.required]],
      description: ['', [Validators.required]],
      grantedAuthority: ['', [Validators.required]],
    });

    this.formType = this.dialogData.formType;
    if (this.formType === 'edit') {
      this.form.patchValue({
        operationName: this.dialogData.data.operationName,
        description: this.dialogData.data.operationDescription,
        grantedAuthority: this.dialogData.data.grantedAuthority,
      });
      this.form.get('grantedAuthority')?.disable();
    }
  }

  onSave(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    this.loading = true;
    this.authService
      .addOperations(this.formType, {
        id: this.dialogData?.data?.id || '',
        operationName: this.form.get('operationName')?.value,
        operationDescription: this.form.get('description')?.value,
        grantedAuthority: this.form.get('grantedAuthority')?.value,
      })
      .subscribe({
        next: (resp) => {
          this.loading = false;
          if (resp.success) {
            this.notificationService.success(
              'The Operation has been ' + this.formType + 'ed successfully.'
            );
            this.modal.close();
          }
        },
        error: (err) => {
          this.loading = false;
          this.formValidation.validateAllFields(this.form, err);
        },
      });
  }
}
