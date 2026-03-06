import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { CssMonitoringService } from '../css-monitoring.service';
import { RfcScheduler, RfcSchedulerService } from './rfc-scheduler.service';

@Component({
  standalone: false,
  selector: 'app-add-rfc-scheduler-modal',
  templateUrl: './add-rfc-scheduler-modal.component.html',
})
export class AddRfcSchedulerModalComponent implements OnInit {
  readonly modalData: { scheduler: RfcScheduler | null } = inject(NZ_MODAL_DATA);

  form!: FormGroup;
  saving = false;
  sapSystems: any[] = [];
  days = [1, 2, 3, 7, 14, 30, 60, 90];

  constructor(
    private modalRef: NzModalRef,
    private fb: FormBuilder,
    private rfcSchedulerService: RfcSchedulerService,
    private cssMonitoringService: CssMonitoringService,
    private notificationService: NotificationService,
  ) {
    const s = this.modalData.scheduler;
    this.form = this.fb.group({
      name: [s?.name || '', [Validators.required]],
      sapSystemId: [s?.sapSystemId || null, [Validators.required]],
      description: [s?.description || ''],
      startDate: [s?.startDate ? new Date(s.startDate) : new Date(), [Validators.required]],
      endDate: [s?.endDate ? new Date(s.endDate) : null],
      repeatPeriodically: [s?.repeatPeriodically || false],
      repeatAfterDays: [s?.repeatAfterDays || 1],
      isEnabled: [s?.isEnabled !== false],
    });
  }

  ngOnInit(): void {
    this.loadSapSystems();
  }

  loadSapSystems(): void {
    this.cssMonitoringService.getSystemList(null).subscribe({
      next: (resp) => { if (resp.success) this.sapSystems = resp.data; },
    });
  }

  save(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }

    this.saving = true;
    const v = this.form.getRawValue();

    const scheduler: RfcScheduler = {
      id: this.modalData.scheduler?.id,
      name: v.name,
      sapSystemId: v.sapSystemId,
      sapSystemName: this.sapSystems.find(s => s.sapSystemId === v.sapSystemId)?.destinationName,
      description: v.description,
      startDate: v.startDate instanceof Date ? v.startDate.getTime() : v.startDate,
      endDate: v.endDate instanceof Date ? v.endDate.getTime() : v.endDate,
      repeatPeriodically: v.repeatPeriodically,
      repeatAfterDays: v.repeatPeriodically ? v.repeatAfterDays : undefined,
      isEnabled: v.isEnabled,
    };

    this.rfcSchedulerService.saveScheduler(scheduler).subscribe({
      next: (resp) => {
        this.saving = false;
        if (resp.success) {
          this.notificationService.success(resp.message || 'Scheduler saved');
          this.modalRef.close(true);
        } else {
          this.notificationService.error(resp.message || 'Failed to save');
        }
      },
      error: () => {
        this.saving = false;
        this.notificationService.error('Failed to save scheduler');
      },
    });
  }

  close(): void {
    this.modalRef.close();
  }
}
