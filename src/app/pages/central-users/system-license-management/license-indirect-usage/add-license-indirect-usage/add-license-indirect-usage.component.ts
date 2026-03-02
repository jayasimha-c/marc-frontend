import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../../central-users.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
    standalone: false,
    selector: 'app-add-license-indirect-usage',
    templateUrl: './add-license-indirect-usage.component.html'
})
export class AddLicenseIndirectUsageComponent {
    sapSysList: string[] = [];
    licenseTypeList: string[] = [];
    formType = '';
    form: FormGroup;

    constructor(
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private fb: FormBuilder,
        private centralUsersService: CentralUsersService,
        public modal: NzModalRef,
        private notificationService: NotificationService
    ) {
        this.formType = this.dialogData.formType;
        this.form = this.fb.group({
            application: ['', Validators.required],
            appUserID: ['', Validators.required],
            sapSystem: ['', Validators.required],
            noOfUsers: ['', Validators.required],
            licenseType: ['', Validators.required],
        });

        this.centralUsersService.getIndirectUsageInfo().subscribe((resp: any) => {
            if (resp.success && resp.data) {
                this.sapSysList = resp.data.sysDescriptions || [];
                this.licenseTypeList = resp.data.licenseTypeDescriptions || [];
            }
        });

        if (this.formType === 'Edit' && this.dialogData.data) {
            this.form.patchValue({
                application: this.dialogData.data.application,
                appUserID: this.dialogData.data.userId,
                sapSystem: this.dialogData.data.system,
                noOfUsers: this.dialogData.data.users,
                licenseType: this.dialogData.data.licenseDesc,
            });
        }
    }

    save(): void {
        this.form.markAllAsTouched();
        if (!this.form.valid) return;

        const payload: any = {
            application: this.form.value.application,
            userId: this.form.value.appUserID,
            system: this.form.value.sapSystem,
            users: this.form.value.noOfUsers,
            licenseDesc: this.form.value.licenseType,
        };

        if (this.formType === 'Edit') {
            payload.id = this.dialogData.data.id;
        }

        const save$ = this.formType === 'Edit'
            ? this.centralUsersService.editIndirectSave(payload)
            : this.centralUsersService.addIndirectSave(payload);

        save$.subscribe((resp: any) => {
            this.notificationService.success(resp.data || 'Saved successfully');
            this.modal.close(true);
        });
    }
}
