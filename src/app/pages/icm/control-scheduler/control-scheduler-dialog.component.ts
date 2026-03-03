import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef, NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { ControlSchedulerService } from './control-scheduler.service';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-control-scheduler-dialog',
  imports: [
    CommonModule, ReactiveFormsModule,
    NzFormModule, NzInputModule, NzSelectModule, NzDatePickerModule,
    NzSwitchModule, NzButtonModule, NzIconModule, NzInputNumberModule,
    NzAlertModule, NzModalModule,
  ],
  template: `
    <form [formGroup]="form">
      <div nz-row [nzGutter]="16" style="margin-bottom: 16px;">
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-control nzErrorTip="Scheduler name is required">
              <div class="nz-float-label" [class.has-value]="form.get('name')!.value">
                <input nz-input placeholder=" " formControlName="name" maxlength="255" />
                <label>Scheduler Name *</label>
              </div>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-control nzErrorTip="SAP System is required">
              <div class="nz-float-label" [class.has-value]="form.get('sapSystemId')!.value">
                <nz-select formControlName="sapSystemId" nzPlaceHolder=" " nzShowSearch nzAllowClear>
                  <nz-option *ngFor="let sys of sapSystemList" [nzValue]="sys.id"
                    [nzLabel]="sys.destinationName || sys.name"></nz-option>
                </nz-select>
                <label>SAP System *</label>
              </div>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <div nz-row [nzGutter]="16" style="margin-bottom: 16px;">
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-control>
              <div class="nz-float-label" [class.has-value]="form.get('scheduleKind')!.value !== null">
                <nz-select formControlName="scheduleKind" nzPlaceHolder=" ">
                  <nz-option *ngFor="let kind of scheduleKindOptions" [nzValue]="kind.value"
                    [nzLabel]="kind.label"></nz-option>
                </nz-select>
                <label>Schedule Type</label>
              </div>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col [nzSpan]="12" *ngIf="isRecurring()">
          <nz-form-item>
            <nz-form-control>
              <div class="nz-float-label has-value">
                <nz-input-number formControlName="repeatAfterDays" [nzMin]="1" [nzMax]="365"
                  style="width: 100%;" nzPlaceHolder=" "></nz-input-number>
                <label>Repeat Every (Days)</label>
              </div>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <div nz-row [nzGutter]="16" style="margin-bottom: 16px;">
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-control nzErrorTip="Start date is required">
              <div class="nz-float-label has-value">
                <nz-date-picker formControlName="startDate" [nzShowTime]="true"
                  nzFormat="yyyy-MM-dd HH:mm" style="width: 100%;" nzPlaceHolder=" "></nz-date-picker>
                <label>Start Date *</label>
              </div>
            </nz-form-control>
          </nz-form-item>
        </div>
        <div nz-col [nzSpan]="12">
          <nz-form-item>
            <nz-form-control>
              <div class="nz-float-label has-value">
                <nz-date-picker formControlName="endDate" [nzShowTime]="true"
                  nzFormat="yyyy-MM-dd HH:mm" style="width: 100%;" nzPlaceHolder=" "></nz-date-picker>
                <label>End Date</label>
              </div>
              <span style="font-size: 12px; color: rgba(0,0,0,0.45);">Leave empty for no end date</span>
            </nz-form-control>
          </nz-form-item>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 16px;">
        <div *ngIf="isRecurring()" style="display: flex; align-items: center; gap: 8px;">
          <nz-switch formControlName="repeatPeriodically"></nz-switch>
          <span>Repeat Periodically</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <nz-switch formControlName="enabled"></nz-switch>
          <span [style.color]="form.get('enabled')!.value ? '#52c41a' : undefined">
            {{ form.get('enabled')!.value ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
      </div>

      <nz-alert *ngIf="!isEdit" nzType="info" nzShowIcon
        nzMessage="After creating the scheduler, you can add control books and individual controls from the scheduler detail page.">
      </nz-alert>
    </form>

    <div class="modal-footer">
      <button nz-button nzType="default" (click)="modal.close()">Cancel</button>
      <button nz-button nzType="primary" (click)="save()">
        {{ isEdit ? 'Update' : 'Create' }}
      </button>
    </div>
  `,
})
export class ControlSchedulerDialogComponent implements OnInit {
  isEdit = false;
  schedulerId: number | null = null;
  sapSystemList: any[] = [];

  scheduleKindOptions = [
    { value: 0, label: 'One-Time' },
    { value: 1, label: 'Recurring' },
  ];

  form!: FormGroup;

  constructor(
    public modal: NzModalRef,
    private fb: FormBuilder,
    private schedulerService: ControlSchedulerService,
    private icmService: IcmControlService,
    private notificationService: NotificationService,
    @Inject(NZ_MODAL_DATA) public dialogData: any,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      sapSystemId: [null, [Validators.required]],
      scheduleKind: [1],
      startDate: [null, [Validators.required]],
      endDate: [null],
      repeatPeriodically: [true],
      repeatAfterDays: [1, [Validators.min(1)]],
      enabled: [true],
    });

    const action = this.dialogData?.action || 'create';
    this.isEdit = action === 'edit';

    if (this.isEdit && this.dialogData?.scheduler) {
      this.schedulerId = this.dialogData.scheduler.id;
      const s = this.dialogData.scheduler;
      this.form.patchValue({
        name: s.name,
        sapSystemId: s.sapSystemId,
        scheduleKind: s.scheduleKind ?? 1,
        startDate: s.startDate ? new Date(s.startDate) : null,
        endDate: s.endDate ? new Date(s.endDate) : null,
        repeatPeriodically: s.repeatPeriodically,
        repeatAfterDays: s.repeatAfterDays || 1,
        enabled: s.enabled,
      });
    }
  }

  ngOnInit(): void {
    this.icmService.getSAPSystemList().subscribe({
      next: resp => this.sapSystemList = resp.data || [],
      error: () => this.sapSystemList = [],
    });
  }

  isRecurring(): boolean {
    return this.form.get('scheduleKind')!.value === 1;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    const v = this.form.value;
    const payload = {
      name: v.name,
      sapSystemId: v.sapSystemId,
      scheduleKind: v.scheduleKind,
      startDate: v.startDate ? new Date(v.startDate).getTime() : null,
      endDate: v.endDate ? new Date(v.endDate).getTime() : null,
      repeatPeriodically: v.repeatPeriodically,
      repeatAfterDays: v.repeatAfterDays,
      enabled: v.enabled,
    };

    const obs = this.isEdit
      ? this.schedulerService.update(this.schedulerId!, payload)
      : this.schedulerService.create(payload);

    obs.subscribe({
      next: resp => { this.notificationService.show(resp); this.modal.close(true); },
      error: err => this.notificationService.handleHttpError(err),
    });
  }
}
