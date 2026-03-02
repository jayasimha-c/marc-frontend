import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../../../core/services/notification.service';
import { SetupService } from '../../../setup.service';

@Component({
    selector: 'app-start-job',
    templateUrl: './start-job.component.html',
    standalone: false
})
export class StartJobComponent {
    sapSysList: any[] = [];
    form: FormGroup;
    loading = false;

    constructor(
        public modal: NzModalRef,
        private notificationService: NotificationService,
        private setupService: SetupService,
        private formBuilder: FormBuilder,
        @Inject(NZ_MODAL_DATA) public dialogData: any
    ) {
        this.sapSysList = this.dialogData.sapSys || [];
        this.form = this.formBuilder.group({
            sapSystems: [null, [Validators.required]]
        });
    }

    save(): void {
        if (this.form.valid) {
            this.loading = true;
            this.setupService.privScheduleStartJob(this.form.get('sapSystems')?.value).subscribe({
                next: (res) => {
                    if (res.success) {
                        this.notificationService.success(res.message || 'Job started successfully');
                        this.modal.close(true);
                    } else {
                        this.notificationService.error(res.message || 'Failed to start job');
                        this.loading = false;
                    }
                },
                error: (err) => {
                    this.notificationService.error(err.error?.message || 'Error occurred while starting job');
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
