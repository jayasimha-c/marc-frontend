import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SetupService } from '../../setup.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
    selector: 'app-add-privilege',
    templateUrl: './add-privilege.component.html',
    standalone: false
})
export class AddPrivilegeComponent implements OnInit {
    formType = 'Add';
    form!: FormGroup;
    loading = false;

    constructor(
        public modal: NzModalRef,
        private fb: FormBuilder,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private setupService: SetupService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.formType = this.dialogData?.formType || 'Add';

        this.form = this.fb.group({
            privilegeId: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9_-]*$/)]],
            description: ['', [Validators.required]]
        });

        if (this.formType === 'Edit' && this.dialogData?.data) {
            this.form.patchValue({
                privilegeId: this.dialogData.data.id,
                description: this.dialogData.data.description
            });
            this.form.get('privilegeId')!.disable();
        }
    }

    save(): void {
        if (this.form.valid) {
            this.loading = true;
            const formVal = this.form.getRawValue();
            const payload = { id: formVal.privilegeId, description: formVal.description };

            const request$ = this.formType === 'Edit'
                ? this.setupService.updatePrivilege(payload)
                : this.setupService.addPrivilege(payload);

            request$.subscribe({
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
