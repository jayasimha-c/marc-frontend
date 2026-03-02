import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { OAuth2Service } from '../../oauth2.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-edit-scope',
  templateUrl: './add-edit-scope.component.html',
})
export class AddEditScopeComponent implements OnInit {
  scopeForm!: FormGroup;
  mode: 'add' | 'edit';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private oauth2Service: OAuth2Service,
    private notificationService: NotificationService,
    public modal: NzModalRef,
    @Inject(NZ_MODAL_DATA) public data: any,
  ) {
    this.mode = data.mode;
    this.scopeForm = this.fb.group({
      scopeName: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_:-]+$/)]],
      description: [''],
      resource: [''],
      permission: [''],
    });
  }

  ngOnInit(): void {
    if (this.mode === 'edit' && this.data.scope) {
      this.scopeForm.patchValue(this.data.scope);
      this.scopeForm.get('scopeName')?.disable();
    }
  }

  onSubmit(): void {
    if (this.scopeForm.invalid) {
      this.scopeForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.scopeForm.getRawValue();

    if (this.mode === 'add') {
      this.oauth2Service.createScope(formValue).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.success('Scope created successfully');
          this.modal.close(true);
        },
        error: (err: any) => {
          this.loading = false;
          this.notificationService.error(err.error?.message || 'Failed to create scope');
        },
      });
    } else {
      this.oauth2Service.updateScope(this.data.scope.id, formValue).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.success('Scope updated successfully');
          this.modal.close(true);
        },
        error: () => {
          this.loading = false;
          this.notificationService.error('Failed to update scope');
        },
      });
    }
  }
}
