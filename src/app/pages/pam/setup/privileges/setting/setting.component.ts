import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SetupService } from '../../setup.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
    selector: 'app-privilege-setting',
    templateUrl: './setting.component.html',
    standalone: false
})
export class PrivilegeSettingComponent implements OnInit {
    form!: FormGroup;
    loading = false;
    privilegeId = '';

    constructor(
        public modal: NzModalRef,
        private fb: FormBuilder,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private setupService: SetupService,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.privilegeId = this.dialogData?.data?.id || '';

        this.form = this.fb.group({
            sendTxnLog: [false],
            setMaxDays: [true],
            maxDays: [null],
            sameApproverReviewer: [false],
            sameRequesterApprover: [false],
            ticketValidate: [false]
        });

        this.loadSettings();
    }

    loadSettings(): void {
        if (!this.privilegeId) return;
        this.loading = true;
        this.setupService.getPrivilegeSetting(this.privilegeId).subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    const s = res.data;
                    this.form.patchValue({
                        sendTxnLog: s.sendTxnLog || false,
                        setMaxDays: s.maxDays != null,
                        maxDays: s.maxDays,
                        sameApproverReviewer: s.sameApproverReviewer || false,
                        sameRequesterApprover: s.sameRequesterApprover || false,
                        ticketValidate: s.ticketValidate || false
                    });
                }
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    save(): void {
        this.loading = true;
        const v = this.form.value;
        const payload = {
            sendTxnLog: v.sendTxnLog,
            maxDays: v.setMaxDays ? v.maxDays : null,
            sameApproverReviewer: v.sameApproverReviewer,
            sameRequesterApprover: v.sameRequesterApprover,
            ticketValidate: v.ticketValidate
        };

        this.setupService.savePrivilegeSetting(this.privilegeId, payload).subscribe({
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
    }
}
