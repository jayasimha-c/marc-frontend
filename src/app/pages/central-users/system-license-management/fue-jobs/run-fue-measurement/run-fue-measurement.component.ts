import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { CentralUsersService } from '../../../central-users.service';
import { NotificationService } from '../../../../../core/services/notification.service';

@Component({
    standalone: false,
    selector: 'app-run-fue-measurement',
    templateUrl: './run-fue-measurement.component.html'
})
export class RunFueMeasurementComponent implements OnInit {
    form!: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        public modal: NzModalRef,
        private centralUsersService: CentralUsersService,
        private notificationService: NotificationService
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            measureFrom: [null, Validators.required],
            measureTo: [null, Validators.required],
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;
        this.loading = true;
        this.centralUsersService.runFueMeasurement(this.form.value).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.success) {
                    this.notificationService.success('FUE Measurement started successfully');
                    this.modal.close(true);
                } else {
                    this.notificationService.error(res.message || 'Failed to start measurement');
                }
            },
            error: () => {
                this.loading = false;
                this.notificationService.error('Failed to start measurement');
            }
        });
    }
}
