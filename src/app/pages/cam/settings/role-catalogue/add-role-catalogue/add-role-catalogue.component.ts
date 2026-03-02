import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { RoleCatalogueService } from '../role-catalogue.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-role-catalogue',
  templateUrl: './add-role-catalogue.component.html',
})
export class AddRoleCatalogueComponent {
  sapSysList: string[] = [];
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    private notificationService: NotificationService,
    public modal: NzModalRef,
    private rcService: RoleCatalogueService,
  ) {
    this.sapSysList = this.dialogData.saps || [];
    this.form = this.fb.group({
      role: ['', [Validators.required]],
      businessProcess: ['', [Validators.required]],
      subProcess: ['', [Validators.required]],
      department: ['', [Validators.required]],
      division: ['', [Validators.required]],
      criticality: ['', [Validators.required]],
      certificateRequire: ['', [Validators.required]],
      roleMapping: ['', [Validators.required]],
      roleType: ['', [Validators.required]],
      system: ['', [Validators.required]],
    });

    if (this.dialogData.action === 'edit') {
      const row = this.dialogData.row;
      this.form.patchValue({
        role: row.roleName,
        businessProcess: row.businessProcess,
        subProcess: row.subBusinessProcess,
        department: row.department,
        division: row.division,
        criticality: row.criticality,
        certificateRequire: row.certRequired,
        roleMapping: row.roleMapping,
        roleType: row.roleType,
        system: row.sapSystem,
      });
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      this.notificationService.error('Please fill all required fields');
      return;
    }

    const payload: any = {
      roleName: this.form.get('role')!.value,
      businessProcess: this.form.get('businessProcess')!.value,
      subBusinessProcess: this.form.get('subProcess')!.value,
      department: this.form.get('department')!.value,
      division: this.form.get('division')!.value,
      criticality: this.form.get('criticality')!.value,
      certRequired: this.form.get('certificateRequire')!.value,
      roleMapping: this.form.get('roleMapping')!.value,
      roleType: this.form.get('roleType')!.value,
      sapSystem: this.form.get('system')!.value,
    };

    if (this.dialogData.action === 'edit') {
      payload.id = this.dialogData.row.id;
    }

    const obs$ = this.dialogData.action === 'edit'
      ? this.rcService.editRoleCatalogue(payload)
      : this.rcService.addRoleCatalogue(payload);

    obs$.subscribe({
      next: (res: any) => {
        if (res.success) {
          this.notificationService.success(res.message);
          this.modal.close(true);
        }
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Operation failed');
      },
    });
  }
}
