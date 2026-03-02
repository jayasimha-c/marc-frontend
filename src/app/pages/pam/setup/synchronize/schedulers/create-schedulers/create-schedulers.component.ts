import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { SetupService } from '../../../setup.service';
import { NotificationService } from '../../../../../../core/services/notification.service';

@Component({
    selector: 'app-create-schedulers',
    templateUrl: './create-schedulers.component.html',
    standalone: false
})
export class CreateSchedulersComponent implements OnInit {
    formType = 'Create';
    sapSysList: any[] = [];
    daysList: number[] = Array.from({ length: 31 }, (_, i) => i);
    hoursList: number[] = Array.from({ length: 24 }, (_, i) => i);
    minsList: number[] = Array.from({ length: 60 }, (_, i) => i);

    form!: FormGroup;
    loading = false;

    constructor(
        public modal: NzModalRef,
        private notificationService: NotificationService,
        private formBuilder: FormBuilder,
        @Inject(NZ_MODAL_DATA) public dialogData: any,
        private setupService: SetupService
    ) { }

    ngOnInit(): void {
        this.formType = this.dialogData.formType || 'Create';
        this.sapSysList = this.dialogData?.sapSystem || [];

        this.form = this.formBuilder.group({
            sapSystems: [[], [Validators.required]],
            startDateTime: [null, [Validators.required]],
            endDateTime: [null, [Validators.required]],
            repeatAfterDays: [0, [Validators.required]],
            repeatAfterHours: [0, [Validators.required]],
            repeatAfterMins: [0, [Validators.required]],
        });

        if (this.formType === 'Edit' && this.dialogData?.data) {
            const rowData = this.dialogData.data;
            let repeatAfterStr = (rowData.repeatAfterStr || '0,0,0').split(',');

            this.form.patchValue({
                sapSystems: rowData.sapIds || [],
                startDateTime: new Date(parseInt(rowData.startDate)),
                endDateTime: new Date(parseInt(rowData.endDate)),
                repeatAfterDays: parseInt(repeatAfterStr[0] || '0'),
                repeatAfterHours: parseInt(repeatAfterStr[1] || '0'),
                repeatAfterMins: parseInt(repeatAfterStr[2] || '0')
            });
        }
    }

    private formatDate(d: Date): string {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    private formatTime(d: Date): string {
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    save(): void {
        if (this.form.valid) {
            this.loading = true;
            const formVal = this.form.value;

            const startDate = new Date(formVal.startDateTime);
            const endDate = new Date(formVal.endDateTime);

            const payload: any = {
                saps: formVal.sapSystems,
                startDate: this.formatDate(startDate),
                startTime: this.formatTime(startDate),
                endDate: this.formatDate(endDate),
                endTime: this.formatTime(endDate),
                days: formVal.repeatAfterDays,
                hours: formVal.repeatAfterHours,
                minutes: formVal.repeatAfterMins,
                timeZone: 'Asia/Calcutta'
            };

            if (this.formType === 'Edit') {
                payload['id'] = this.dialogData?.data.id;
            }

            this.setupService.savePriv_schedule(payload).subscribe({
                next: (res: any) => {
                    this.notificationService.success(res.message || 'Scheduler saved');
                    this.modal.close(true);
                },
                error: (err: any) => {
                    this.notificationService.error(err.error?.message || 'Failed to save scheduler');
                    this.loading = false;
                }
            });
        } else {
            Object.values(this.form.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }
    }
}

