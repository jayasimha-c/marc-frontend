import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { ServiceNowService, SnowAgentConfig } from '../servicenow.service';

export interface ConfigDialogData {
  config?: SnowAgentConfig;
}

@Component({
  standalone: false,
  selector: 'app-snow-agent-config-dialog',
  template: `
    <form [formGroup]="configForm" nz-form nzLayout="vertical">
      <!-- System Selection -->
      <div class="config-dialog__row">
        <nz-form-item>
          <nz-form-label nzRequired>ServiceNow System</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="snowSystemId" nzPlaceHolder="Select ServiceNow System">
              <nz-option *ngFor="let s of snowSystems" [nzValue]="s.id" [nzLabel]="s.destinationName"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label nzRequired>Target SAP System</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="targetSapSystemId" nzPlaceHolder="Select Target SAP System">
              <nz-option *ngFor="let s of sapSystems" [nzValue]="s.id" [nzLabel]="s.destinationName"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      </div>

      <!-- Toggles -->
      <div class="config-dialog__toggles">
        <label nz-checkbox formControlName="enabled">Enabled</label>
        <label nz-checkbox formControlName="autoProvision">Auto-Provision</label>
      </div>

      <!-- Risk Threshold -->
      <nz-form-item>
        <nz-form-label nzRequired>Risk Threshold</nz-form-label>
        <nz-form-control nzExtra="Maximum acceptable risk severity for auto-approval">
          <nz-select formControlName="riskThreshold" nzPlaceHolder="Select Risk Threshold">
            <nz-option *ngFor="let t of riskThresholds" [nzValue]="t.value" [nzLabel]="t.label"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Poll Schedule -->
      <nz-form-item>
        <nz-form-label>Poll Schedule</nz-form-label>
        <nz-form-control>
          <div *ngIf="!useCustomCron" class="config-dialog__schedule">
            <span>Every:</span>
            <nz-select formControlName="cronDays" style="width: 80px;" nzPlaceHolder="Days">
              <nz-option *ngFor="let d of days" [nzValue]="d" [nzLabel]="'' + d"></nz-option>
            </nz-select>
            <span>d</span>
            <nz-select formControlName="cronHours" style="width: 80px;" nzPlaceHolder="Hrs">
              <nz-option *ngFor="let h of hours" [nzValue]="h" [nzLabel]="'' + h"></nz-option>
            </nz-select>
            <span>h</span>
            <nz-select formControlName="cronMins" style="width: 80px;" nzPlaceHolder="Min">
              <nz-option *ngFor="let m of mins" [nzValue]="m" [nzLabel]="'' + m"></nz-option>
            </nz-select>
            <span>m</span>
          </div>
          <div *ngIf="useCustomCron" class="config-dialog__schedule">
            <input nz-input formControlName="pollCron" placeholder="0 0/30 * * * ?" style="flex: 1;">
            <span nz-icon nzType="question-circle" nzTheme="outline"
              nz-tooltip nzTooltipTitle="Quartz CRON format: seconds minutes hours day month weekday"
              style="color: #8c8c8c; cursor: help;"></span>
          </div>
          <label nz-checkbox [(ngModel)]="useCustomCron" [ngModelOptions]="{standalone: true}" style="margin-top: 8px;">
            Use custom CRON
          </label>
        </nz-form-control>
      </nz-form-item>

      <!-- Catalogue Item ID -->
      <nz-form-item>
        <nz-form-label>ServiceNow Catalogue Item ID</nz-form-label>
        <nz-form-control nzExtra="SNOW sys_id of the catalogue item to monitor">
          <input nz-input formControlName="snowCatalogueItemId" placeholder="Optional — filter by catalogue item">
        </nz-form-control>
      </nz-form-item>

      <!-- Role Field Name -->
      <div class="config-dialog__row">
        <nz-form-item style="flex: 1;">
          <nz-form-label>Role Field Name</nz-form-label>
          <nz-form-control nzExtra="SNOW field containing the business role name">
            <input nz-input formControlName="roleFieldName"
              placeholder="e.g. variables.u_business_role"
              [nzAutocomplete]="roleFieldAuto">
            <nz-autocomplete #roleFieldAuto>
              <nz-auto-option *ngFor="let f of filteredRoleFields" [nzValue]="f.value" [nzLabel]="f.value">
                {{ f.value }} <span style="color: #8c8c8c; font-size: 12px; margin-left: 8px;">{{ f.hint }}</span>
              </nz-auto-option>
            </nz-autocomplete>
          </nz-form-control>
        </nz-form-item>
        <button nz-button nzType="default" style="align-self: center; margin-top: 8px;"
          [disabled]="!configForm.get('snowSystemId')?.value || testing"
          (click)="onTestConnection()"
          nz-tooltip nzTooltipTitle="Test connection and discover available fields">
          <span nz-icon [nzType]="testing ? 'loading' : 'api'" nzTheme="outline"></span>
          {{ testing ? 'Testing...' : 'Discover' }}
        </button>
      </div>

      <!-- Connection Test Result -->
      <nz-alert *ngIf="testResult"
        [nzType]="testResult.connected ? 'success' : 'error'"
        [nzMessage]="testResult.message"
        nzShowIcon>
      </nz-alert>

      <!-- Discovered Fields -->
      <div *ngIf="discoveredFields.length > 0" style="margin-top: 8px;">
        <span style="font-size: 12px; color: #8c8c8c;">
          Discovered {{ discoveredFields.length }} fields — click to use:
        </span>
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; max-height: 120px; overflow-y: auto;">
          <nz-tag *ngFor="let field of discoveredFields"
            style="cursor: pointer;"
            [nzColor]="field === configForm.get('roleFieldName')?.value ? 'blue' : 'default'"
            nz-tooltip [nzTooltipTitle]="getFieldPreview(field)"
            (click)="selectDiscoveredField(field)">
            {{ field }}
          </nz-tag>
        </div>
      </div>

      <nz-divider nzText="Provisioning Rules"></nz-divider>

      <!-- Agent Requester -->
      <nz-form-item>
        <nz-form-label>Agent Requester</nz-form-label>
        <nz-form-control nzExtra="MARC user identity the agent acts as">
          <nz-select formControlName="requesterUserId" nzPlaceHolder="Select Requester" nzShowSearch
            (ngModelChange)="onRequesterChange($event)">
            <nz-option *ngFor="let u of appUsers" [nzValue]="u.id"
              [nzLabel]="u.username + (u.firstName || u.lastName ? ' (' + (u.firstName || '') + ' ' + (u.lastName || '') + ')' : '')">
            </nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <div class="config-dialog__row config-dialog__row--3col">
        <nz-form-item>
          <nz-form-label>User Group</nz-form-label>
          <nz-form-control nzExtra="SAP user group">
            <input nz-input formControlName="defaultUserGroup" placeholder="e.g. SUPER">
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>User Type</nz-form-label>
          <nz-form-control>
            <nz-select formControlName="defaultUserType">
              <nz-option *ngFor="let t of userTypes" [nzValue]="t.value" [nzLabel]="t.label"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>
        <nz-form-item>
          <nz-form-label>Validity (days)</nz-form-label>
          <nz-form-control nzExtra="Role validity period">
            <nz-input-number formControlName="validityDays" [nzMin]="1" [nzMax]="9999" style="width: 100%"></nz-input-number>
          </nz-form-control>
        </nz-form-item>
      </div>
    </form>

    <!-- Footer -->
    <div class="config-dialog__footer">
      <button nz-button nzType="default" (click)="onCancel()">Cancel</button>
      <button nz-button nzType="primary" [disabled]="!configForm.valid || saving" [nzLoading]="saving" (click)="onSave()">
        Save
      </button>
    </div>
  `,
  styles: [`
    .config-dialog__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .config-dialog__row--3col {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .config-dialog__toggles {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
    }
    .config-dialog__schedule {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .config-dialog__footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0f0f0;
    }
  `]
})
export class SnowAgentConfigDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  configForm: FormGroup;
  snowSystems: any[] = [];
  sapSystems: any[] = [];
  appUsers: any[] = [];
  saving = false;
  useCustomCron = false;
  testing = false;
  testResult: { connected: boolean; message: string } | null = null;
  discoveredFields: string[] = [];
  fieldPreviewMap: { [key: string]: string } = {};

  commonRoleFields = [
    { value: 'short_description', hint: 'Standard request item field' },
    { value: 'description', hint: 'Request item description' },
    { value: 'variables.requested_role', hint: 'Catalogue variable' },
    { value: 'variables.role_name', hint: 'Catalogue variable' },
    { value: 'variables.u_business_role', hint: 'Custom catalogue variable' },
    { value: 'variables.u_role_name', hint: 'Custom catalogue variable' },
    { value: 'u_business_role', hint: 'Custom field on sc_req_item' },
    { value: 'cat_item.short_description', hint: 'Catalogue item name' }
  ];
  filteredRoleFields = this.commonRoleFields;

  riskThresholds = [
    { value: 'NONE', label: 'None — No violations allowed' },
    { value: 'LOW', label: 'Low — Allow low severity' },
    { value: 'MEDIUM', label: 'Medium — Allow up to medium' },
    { value: 'HIGH', label: 'High — Allow up to high' },
    { value: 'CRITICAL', label: 'Critical — Allow all' }
  ];

  userTypes = [
    { value: 'Dialog', label: 'Dialog (A)' },
    { value: 'System', label: 'System (B)' },
    { value: 'Communication', label: 'Communication (C)' },
    { value: 'Reference', label: 'Reference (L)' },
    { value: 'Service', label: 'Service (S)' }
  ];

  days = Array.from({ length: 32 }, (_, i) => i);
  hours = Array.from({ length: 24 }, (_, i) => i);
  mins = Array.from({ length: 60 }, (_, i) => i);

  data: ConfigDialogData;

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    @Inject(NZ_MODAL_DATA) modalData: any,
    private servicenowService: ServiceNowService
  ) {
    this.data = modalData || {};
    this.configForm = this.fb.group({
      snowSystemId: [null, Validators.required],
      targetSapSystemId: [null, Validators.required],
      enabled: [true],
      autoProvision: [false],
      riskThreshold: ['NONE', Validators.required],
      pollCron: [''],
      cronDays: [0],
      cronHours: [0],
      cronMins: [30],
      roleFieldName: ['short_description'],
      snowCatalogueItemId: [''],
      requesterUserId: [null],
      requesterName: [''],
      defaultUserGroup: ['SUPER'],
      defaultUserType: ['Dialog'],
      validityDays: [365]
    });
  }

  ngOnInit(): void {
    this.loadSystems();
    this.loadAppUsers();

    if (this.data.config) {
      this.populateForm(this.data.config);
    }

    this.configForm.get('roleFieldName')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const filter = (value || '').toLowerCase();
        this.filteredRoleFields = this.commonRoleFields.filter(f =>
          f.value.toLowerCase().includes(filter)
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAppUsers(): void {
    this.servicenowService.getAppUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp.success && resp.data) {
            this.appUsers = resp.data.rows || resp.data;
          }
        }
      });
  }

  onRequesterChange(userId: number): void {
    const user = this.appUsers.find(u => u.id === userId);
    if (user) {
      this.configForm.patchValue({ requesterName: user.username });
    }
  }

  private loadSystems(): void {
    this.servicenowService.getServiceNowSystems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) this.snowSystems = resp.data;
        }
      });

    this.servicenowService.getSapSystems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (resp.success && resp.data) this.sapSystems = resp.data;
        }
      });
  }

  private populateForm(config: SnowAgentConfig): void {
    const schedule = this.parseCronToSchedule(config.pollCron);
    this.useCustomCron = !!config.pollCron && !this.isSimpleCron(config.pollCron);

    this.configForm.patchValue({
      snowSystemId: config.snowSystemId,
      targetSapSystemId: config.targetSapSystemId,
      enabled: config.enabled,
      autoProvision: config.autoProvision,
      riskThreshold: config.riskThreshold || 'NONE',
      pollCron: config.pollCron || '',
      cronDays: schedule.days,
      cronHours: schedule.hours,
      cronMins: schedule.mins,
      roleFieldName: config.roleFieldName || 'short_description',
      snowCatalogueItemId: config.snowCatalogueItemId || '',
      requesterUserId: config.requesterUserId || null,
      requesterName: config.requesterName || '',
      defaultUserGroup: config.defaultUserGroup || 'SUPER',
      defaultUserType: config.defaultUserType || 'Dialog',
      validityDays: config.validityDays || 365
    });
  }

  onSave(): void {
    if (!this.configForm.valid) return;

    this.saving = true;
    const formValue = this.configForm.value;

    let pollCron = formValue.pollCron;
    if (!this.useCustomCron) {
      pollCron = this.buildCronFromSchedule(formValue.cronDays, formValue.cronHours, formValue.cronMins);
    }

    const config: SnowAgentConfig = {
      id: this.data.config?.id,
      snowSystemId: formValue.snowSystemId,
      targetSapSystemId: formValue.targetSapSystemId,
      enabled: formValue.enabled,
      autoProvision: formValue.autoProvision,
      riskThreshold: formValue.riskThreshold,
      pollCron,
      roleFieldName: formValue.roleFieldName,
      snowCatalogueItemId: formValue.snowCatalogueItemId || null,
      requesterUserId: formValue.requesterUserId,
      requesterName: formValue.requesterName,
      defaultUserGroup: formValue.defaultUserGroup,
      defaultUserType: formValue.defaultUserType,
      validityDays: formValue.validityDays
    };

    this.servicenowService.saveAgentConfig(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.saving = false;
          if (resp.success) {
            this.modalRef.close(resp.data);
          }
        },
        error: () => {
          this.saving = false;
        }
      });
  }

  onCancel(): void {
    this.modalRef.close();
  }

  onTestConnection(): void {
    const snowSystemId = this.configForm.get('snowSystemId')?.value;
    if (!snowSystemId) return;

    this.testing = true;
    this.testResult = null;
    this.discoveredFields = [];
    this.fieldPreviewMap = {};

    const catalogueItemId = this.configForm.get('snowCatalogueItemId')?.value;

    this.servicenowService.testAgentConnection(snowSystemId, catalogueItemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.testing = false;
          const data = resp.data;
          this.testResult = {
            connected: data?.connected || false,
            message: data?.message || resp.message || 'Unknown result'
          };
          if (data?.fields) this.discoveredFields = data.fields;
          if (data?.sampleValues) this.fieldPreviewMap = data.sampleValues;
        },
        error: () => {
          this.testing = false;
          this.testResult = { connected: false, message: 'Request failed — check network or server logs' };
        }
      });
  }

  selectDiscoveredField(field: string): void {
    this.configForm.patchValue({ roleFieldName: field });
  }

  getFieldPreview(field: string): string {
    const val = this.fieldPreviewMap[field];
    return val ? `Sample: ${val}` : 'No value in sample record';
  }

  private parseCronToSchedule(cron: string | undefined): { days: number; hours: number; mins: number } {
    if (!cron) return { days: 0, hours: 0, mins: 30 };
    const parts = cron.split(' ');
    if (parts.length >= 6) {
      const mins = parseInt(parts[1].replace('0/', '')) || 0;
      const hours = parseInt(parts[2].replace('0/', '')) || 0;
      return { days: 0, hours, mins };
    }
    return { days: 0, hours: 0, mins: 30 };
  }

  private isSimpleCron(cron: string): boolean {
    return /^0\s+(\d+|\*|0\/\d+)\s+(\d+|\*|0\/\d+)\s+(\*|\?)\s+(\*|\?)\s+(\*|\?)$/.test(cron);
  }

  private buildCronFromSchedule(days: number, hours: number, mins: number): string {
    if (mins > 0 && hours === 0 && days === 0) return `0 0/${mins} * * * ?`;
    if (hours > 0 && days === 0) return `0 ${mins} 0/${hours} * * ?`;
    if (days > 0) return `0 ${mins} ${hours} */${days} * ?`;
    return `0 0/${mins || 30} * * * ?`;
  }
}
