import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SetupService } from '../../../setup.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
    selector: 'app-add-sap-mapping',
    templateUrl: './add-sap-mapping.component.html',
    standalone: false
})
export class AddSapMappingComponent implements OnInit {
    formType = 'Add';
    form!: FormGroup;
    loading = false;
    sapSysList: any[] = [];

    constructor(
        public modal: NzModalRef,
        private fb: FormBuilder,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private setupService: SetupService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.formType = this.dialogData?.formType || 'Add';
        this.sapSysList = this.dialogData?.sapSystems || [];

        this.form = this.fb.group({
            sap: [null, [Validators.required]],
            notes: ['', [Validators.required]]
        });

        if (this.formType === 'Edit' && this.dialogData?.data) {
            this.form.patchValue({
                sap: this.dialogData.data.sapId,
                notes: this.dialogData.data.notes
            });
        }
    }

    save(): void {
        if (this.form.valid) {
            this.loading = true;
            const v = this.form.value;

            const payload: any = this.formType === 'Edit'
                ? { id: this.dialogData.data.id, privilegeId: this.dialogData.data.privilegeId, sapId: v.sap, notes: v.notes }
                : { privilegeId: this.dialogData.privilegeId, sapId: v.sap, notes: v.notes };

            this.setupService.saveMapping(payload).subscribe({
                next: (res) => {
                    this.notificationService.show(res);
                    if (res.success) this.modal.close(true);
                    else this.loading = false;
                },
                error: (err) => {
                    this.notificationService.handleHttpError(err);
                    this.loading = false;
                }
            });
        } else {
            Object.values(this.form.controls).forEach(c => {
                if (c.invalid) { c.markAsDirty(); c.updateValueAndValidity({ onlySelf: true }); }
            });
        }
    }
}
