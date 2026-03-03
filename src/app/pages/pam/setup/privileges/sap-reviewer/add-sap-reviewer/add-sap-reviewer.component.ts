import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SetupService } from '../../../setup.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
    selector: 'app-add-sap-reviewer',
    templateUrl: './add-sap-reviewer.component.html',
    standalone: false
})
export class AddSapReviewerComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    usersList: any[] = [];
    userType = '';
    privId = '';

    constructor(
        public modal: NzModalRef,
        private fb: FormBuilder,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private setupService: SetupService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.userType = this.dialogData?.userType || '';
        this.privId = this.dialogData?.privId || '';
        this.usersList = this.dialogData?.usersList || [];

        this.form = this.fb.group({
            userId: [null, [Validators.required]]
        });
    }

    save(): void {
        if (this.form.valid) {
            this.loading = true;
            const payload = {
                userType: this.userType,
                privId: this.privId,
                userIds: [this.form.value.userId]
            };

            this.setupService.savePrivilegeUsers(payload).subscribe({
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
