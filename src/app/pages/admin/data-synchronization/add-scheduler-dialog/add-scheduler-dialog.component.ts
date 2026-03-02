import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { DataSyncService, SyncScheduler, SyncSchedulerFormData, SyncTypeOption, CorrelationSources, ConnectionDTO, RcConceptOption } from '../data-sync.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response';

export interface SchedulerDialogData {
  formType: 'Add' | 'Edit';
  row?: SyncScheduler;
}

@Component({
  standalone: false,
  selector: 'app-add-scheduler-dialog',
  templateUrl: './add-scheduler-dialog.component.html',
  styleUrls: ['./add-scheduler-dialog.component.scss'],
  providers: [DatePipe],
})
export class AddSchedulerDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  formType: string;
  sapSystems: any[] = [];
  syncTypes: SyncTypeOption[] = [];
  days: number[] = Array.from({ length: 30 }, (_, i) => i + 1);
  loading = false;
  saving = false;

  selectedSyncType: SyncTypeOption | null = null;
  correlationSources: CorrelationSources | null = null;
  rcConcepts: RcConceptOption[] = [];
  selectedConcept: RcConceptOption | null = null;

  selectedAdIds: number[] = [];
  selectedAzureIds: number[] = [];
  selectedCisIds: number[] = [];
  selectedSnowIds: number[] = [];
  selectedSapIds: number[] = [];

  analysisWindowOptions = [
    { label: 'Last 7 days', value: 7 },
    { label: 'Last 30 days', value: 30 },
    { label: 'Last 90 days', value: 90 },
  ];

  frequencyOptions = [
    { label: 'Every 15 minutes', value: 15 },
    { label: 'Every 30 minutes', value: 30 },
    { label: 'Every 1 hour', value: 60 },
    { label: 'Every 2 hours', value: 120 },
    { label: 'Every 4 hours', value: 240 },
    { label: 'Every 6 hours', value: 360 },
    { label: 'Every 12 hours', value: 720 },
    { label: 'Every 24 hours', value: 1440 },
  ];

  form!: FormGroup;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: SchedulerDialogData,
    public modal: NzModalRef,
    private fb: FormBuilder,
    private dataSyncService: DataSyncService,
    private notificationService: NotificationService,
    private datePipe: DatePipe,
  ) {
    this.formType = this.dialogData.formType;
  }

  ngOnInit(): void {
    this.initForm();
    this.loadFormData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      syncType: ['', [Validators.required]],
      name: ['', [Validators.required]],
      sapSystemId: ['', [Validators.required]],
      conceptId: [''],
      syncMode: ['FULL', [Validators.required]],
      startDateAndTime: ['', [Validators.required]],
      endDateAndTime: [''],
      repeatPeriodically: [false],
      repeatAfterDays: [{ value: 1, disabled: true }],
      repeatIntervalMinutes: [60],
      analysisWindowDays: [30],
      oneTimeRun: [true],
      monthlyRun: [false],
      monthRunDate: [{ value: '', disabled: true }],
      snowSyncUsers: [true],
      snowSyncRoles: [true],
      snowSyncGroups: [true],
      snowSyncUserRoles: [true],
      snowActiveUsersOnly: [false],
      snowDeleteOrphans: [true],
      snowMaxRecords: [0],
      abapPageSize: [5000],
      roleSyncOrgValues: [false],
      cisSyncUsers: [true],
      cisSyncGroups: [true],
      cisActiveUsersOnly: [false],
      cisDeleteOrphans: [true],
      correlationIncludeAd: [true],
      correlationIncludeAzure: [true],
      correlationIncludeCis: [true],
      correlationIncludeSnow: [true],
      correlationIncludeSap: [true],
    });

    if (this.formType === 'Edit') {
      this.form.get('syncType')?.disable();
    }

    if (this.formType === 'Edit' && this.dialogData.row) {
      const row = this.dialogData.row;

      let startDateTime = null;
      if (row.startDateStr) {
        const timeStr = row.startTimeStr || '00:00';
        startDateTime = new Date(`${row.startDateStr}T${timeStr}`);
      }

      let endDateTime = null;
      if (row.endDateStr) {
        const timeStr = row.endTimeStr || '00:00';
        endDateTime = new Date(`${row.endDateStr}T${timeStr}`);
      }

      let monthRunDate = null;
      if (row.monthRunDateStr) {
        const [month, year] = row.monthRunDateStr.split('/');
        monthRunDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      }

      this.form.patchValue({
        syncType: row.syncType,
        name: row.name,
        sapSystemId: row.sapSystemId,
        conceptId: row.conceptId,
        syncMode: row.syncMode || 'FULL',
        startDateAndTime: startDateTime,
        endDateAndTime: endDateTime,
        repeatPeriodically: row.repeatPeriodically,
        repeatAfterDays: row.repeatAfterDays || 1,
        repeatIntervalMinutes: row.repeatIntervalMinutes || 60,
        analysisWindowDays: row.analysisWindowDays || 30,
        oneTimeRun: row.oneTimeRun ?? true,
        monthlyRun: row.monthlyRun ?? false,
        monthRunDate: monthRunDate,
        snowSyncUsers: row.snowSyncUsers ?? true,
        snowSyncRoles: row.snowSyncRoles ?? true,
        snowSyncGroups: row.snowSyncGroups ?? true,
        snowSyncUserRoles: row.snowSyncUserRoles ?? true,
        snowActiveUsersOnly: row.snowActiveUsersOnly ?? false,
        snowDeleteOrphans: row.snowDeleteOrphans ?? true,
        snowMaxRecords: row.snowMaxRecords ?? 0,
        abapPageSize: row.abapPageSize ?? 5000,
        roleSyncOrgValues: row.roleSyncOrgValues ?? false,
        cisSyncUsers: row.cisSyncUsers ?? true,
        cisSyncGroups: row.cisSyncGroups ?? true,
        cisActiveUsersOnly: row.cisActiveUsersOnly ?? false,
        cisDeleteOrphans: row.cisDeleteOrphans ?? true,
        correlationIncludeAd: row.correlationIncludeAd ?? true,
        correlationIncludeAzure: row.correlationIncludeAzure ?? true,
        correlationIncludeCis: row.correlationIncludeCis ?? true,
        correlationIncludeSnow: row.correlationIncludeSnow ?? true,
        correlationIncludeSap: row.correlationIncludeSap ?? true,
      });

      if (row.repeatPeriodically) this.form.get('repeatAfterDays')?.enable();
      if (row.monthlyRun) this.form.get('monthRunDate')?.enable();
    }
  }

  private loadFormData(): void {
    this.loading = true;
    const id = this.formType === 'Edit' ? this.dialogData.row?.id : undefined;

    this.dataSyncService.getSchedulerInfo(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const formData: SyncSchedulerFormData = resp.data;
            this.sapSystems = formData.sapSystems || [];
            this.syncTypes = formData.syncTypes || [];

            if (this.formType === 'Edit' && this.dialogData.row?.syncType) {
              this.onSyncTypeChange(this.dialogData.row.syncType);
              const row = this.dialogData.row;
              this.selectedAdIds = this.parseIds(row.correlationAdIds);
              this.selectedAzureIds = this.parseIds(row.correlationAzureIds);
              this.selectedCisIds = this.parseIds(row.correlationCisIds);
              this.selectedSnowIds = this.parseIds(row.correlationSnowIds);
              this.selectedSapIds = this.parseIds(row.correlationSapIds);
            }
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load form data');
          this.loading = false;
        },
      });
  }

  private parseIds(idsStr?: string): number[] {
    if (!idsStr) return [];
    return idsStr.split(',').map(s => s.trim()).filter(s => s.length > 0).map(s => parseInt(s, 10)).filter(n => !isNaN(n));
  }

  private joinIds(ids: number[]): string {
    return ids.join(',');
  }

  onSyncTypeChange(syncTypeValue: string): void {
    this.selectedSyncType = this.syncTypes.find(st => st.value === syncTypeValue) || null;

    if (this.selectedSyncType) {
      if (!this.selectedSyncType.supportsIncremental && this.form.get('syncMode')?.value === 'INCREMENTAL') {
        this.form.patchValue({ syncMode: 'FULL' });
      }

      const sapSystemIdControl = this.form.get('sapSystemId');
      const conceptIdControl = this.form.get('conceptId');

      if (syncTypeValue === 'IDENTITY_CORRELATION') {
        sapSystemIdControl?.clearValidators();
        sapSystemIdControl?.setValue(null);
        conceptIdControl?.clearValidators();
        conceptIdControl?.setValue(null);
        this.loadCorrelationSources();
        this.rcConcepts = [];
        this.selectedConcept = null;
      } else if (syncTypeValue === 'ROLE_CATALOGUE') {
        sapSystemIdControl?.clearValidators();
        sapSystemIdControl?.setValue(null);
        conceptIdControl?.setValidators([Validators.required]);
        this.correlationSources = null;
        this.loadRcConcepts();
      } else {
        sapSystemIdControl?.setValidators([Validators.required]);
        conceptIdControl?.clearValidators();
        conceptIdControl?.setValue(null);
        this.correlationSources = null;
        this.rcConcepts = [];
        this.selectedConcept = null;
        this.reloadSystemsForSyncType(syncTypeValue);
      }
      sapSystemIdControl?.updateValueAndValidity();
      conceptIdControl?.updateValueAndValidity();
    }
  }

  private loadRcConcepts(): void {
    this.dataSyncService.getSchedulerInfo(undefined, 'ROLE_CATALOGUE')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.rcConcepts = resp.data.rcConcepts || [];
            if (this.formType === 'Edit' && this.dialogData.row?.conceptId) {
              this.selectedConcept = this.rcConcepts.find(c => c.id === this.dialogData.row!.conceptId) || null;
            }
          }
        },
      });
  }

  onConceptChange(conceptId: number): void {
    this.selectedConcept = this.rcConcepts.find(c => c.id === conceptId) || null;
  }

  private loadCorrelationSources(): void {
    this.dataSyncService.getSchedulerInfo(undefined, 'IDENTITY_CORRELATION')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.correlationSources = resp.data.correlationSources || null;
          }
        },
      });
  }

  toggleConnectionSelection(sourceType: 'ad' | 'azure' | 'cis' | 'snow' | 'sap', id: number): void {
    const arr = this.getConnectionIds(sourceType);
    const idx = arr.indexOf(id);
    if (idx >= 0) { arr.splice(idx, 1); } else { arr.push(id); }
  }

  isConnectionSelected(sourceType: 'ad' | 'azure' | 'cis' | 'snow' | 'sap', id: number): boolean {
    return this.getConnectionIds(sourceType).includes(id);
  }

  selectAllConnections(sourceType: 'ad' | 'azure' | 'cis' | 'snow' | 'sap'): void {
    if (!this.correlationSources) return;
    const connections = this.getConnections(sourceType);
    const ids = connections.map(c => c.id);
    this.setConnectionIds(sourceType, ids);
  }

  clearAllConnections(sourceType: 'ad' | 'azure' | 'cis' | 'snow' | 'sap'): void {
    this.setConnectionIds(sourceType, []);
  }

  private getConnectionIds(sourceType: string): number[] {
    switch (sourceType) {
      case 'ad': return this.selectedAdIds;
      case 'azure': return this.selectedAzureIds;
      case 'cis': return this.selectedCisIds;
      case 'snow': return this.selectedSnowIds;
      case 'sap': return this.selectedSapIds;
      default: return [];
    }
  }

  private setConnectionIds(sourceType: string, ids: number[]): void {
    switch (sourceType) {
      case 'ad': this.selectedAdIds = ids; break;
      case 'azure': this.selectedAzureIds = ids; break;
      case 'cis': this.selectedCisIds = ids; break;
      case 'snow': this.selectedSnowIds = ids; break;
      case 'sap': this.selectedSapIds = ids; break;
    }
  }

  private getConnections(sourceType: string): ConnectionDTO[] {
    if (!this.correlationSources) return [];
    switch (sourceType) {
      case 'ad': return this.correlationSources.adConnections;
      case 'azure': return this.correlationSources.azureConnections;
      case 'cis': return this.correlationSources.cisConnections;
      case 'snow': return this.correlationSources.snowConnections;
      case 'sap': return this.correlationSources.sapConnections;
      default: return [];
    }
  }

  private reloadSystemsForSyncType(syncType: string): void {
    this.dataSyncService.getSchedulerInfo(undefined, syncType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.sapSystems = resp.data.sapSystems || [];
            const currentSystemId = this.form.get('sapSystemId')?.value;
            if (currentSystemId && !this.sapSystems.find((s: any) => s.id === currentSystemId)) {
              this.form.patchValue({ sapSystemId: '' });
            }
          }
        },
      });
  }

  onRepeatToggle(checked: boolean): void {
    if (checked) { this.form.get('repeatAfterDays')?.enable(); }
    else { this.form.get('repeatAfterDays')?.disable(); }
  }

  onMonthlyRunToggle(checked: boolean): void {
    if (checked) {
      this.form.get('monthRunDate')?.enable();
      this.form.get('endDateAndTime')?.disable();
    } else {
      this.form.get('monthRunDate')?.disable();
      this.form.get('endDateAndTime')?.enable();
    }
  }

  isTransactionSync(): boolean { return this.selectedSyncType?.value === 'TRANSACTION'; }
  isServiceNowSync(): boolean { return this.selectedSyncType?.value === 'SERVICENOW'; }
  isAbapProgramSync(): boolean { return this.selectedSyncType?.value === 'ABAP_PROGRAM'; }
  isRoleSync(): boolean { return this.selectedSyncType?.value === 'ROLE'; }
  isUserRoleSync(): boolean { return this.selectedSyncType?.value === 'USER_ROLE'; }
  isTstctSync(): boolean { return this.selectedSyncType?.value === 'TSTCT'; }
  isCISSync(): boolean { return this.selectedSyncType?.value === 'CIS_SYNC'; }
  isIdentityCorrelation(): boolean { return this.selectedSyncType?.value === 'IDENTITY_CORRELATION'; }
  isRoleCatalogueSync(): boolean { return this.selectedSyncType?.value === 'ROLE_CATALOGUE'; }
  isFirefighterLogSync(): boolean { return this.selectedSyncType?.value === 'FF_LOG'; }
  isAuditLogSync(): boolean { return this.selectedSyncType?.value === 'AUDIT_LOG'; }
  isAnomalyDetection(): boolean { return this.selectedSyncType?.value === 'ANOMALY_DETECTION'; }

  private formatDate(date: Date, format: string): string {
    return this.datePipe.transform(date, format) || '';
  }

  save(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      this.notificationService.error('Please fill in all required fields');
      return;
    }

    const formValue = this.form.getRawValue();
    const startDate = formValue.startDateAndTime;
    const endDate = formValue.endDateAndTime;

    if (!this.isTransactionSync() && !endDate) {
      this.notificationService.error('Please select end date and time');
      return;
    }
    if (this.isTransactionSync() && !formValue.monthlyRun && !endDate) {
      this.notificationService.error('Please select end date and time or enable monthly run');
      return;
    }
    if (this.isTransactionSync() && formValue.monthlyRun && !formValue.monthRunDate) {
      this.notificationService.error('Please select a month');
      return;
    }

    this.saving = true;

    const payload: any = {
      name: formValue.name,
      syncType: formValue.syncType,
      syncMode: formValue.syncMode,
    };

    if (!this.isIdentityCorrelation() && !this.isRoleCatalogueSync() && formValue.sapSystemId) {
      payload.sapSystemId = formValue.sapSystemId;
    }
    if (this.isRoleCatalogueSync() && formValue.conceptId) {
      payload.conceptId = formValue.conceptId;
    }

    if (startDate) {
      payload.startDateStr = this.formatDate(startDate, 'yyyy-MM-dd');
      payload.startTimeStr = this.formatDate(startDate, 'HH:mm');
    }

    // Build type-specific payload fields
    this.buildTypeSpecificPayload(payload, formValue, endDate);

    if (this.formType === 'Edit' && this.dialogData.row?.id) {
      payload.id = this.dialogData.row.id;
    }

    this.dataSyncService.saveScheduler(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success(resp.message || 'Scheduler saved successfully');
            this.modal.close(true);
          } else {
            const errorMessage = this.extractValidationErrors(resp) || resp.message || 'Failed to save scheduler';
            this.notificationService.error(errorMessage);
          }
          this.saving = false;
        },
        error: (err) => {
          const errorMessage = this.extractValidationErrors(err.error) || err.error?.message || 'Failed to save scheduler';
          this.notificationService.error(errorMessage);
          this.saving = false;
        },
      });
  }

  private buildTypeSpecificPayload(payload: any, formValue: any, endDate: any): void {
    const appendEndDate = () => {
      if (endDate) {
        payload.endDateStr = this.formatDate(endDate, 'yyyy-MM-dd');
        payload.endTimeStr = this.formatDate(endDate, 'HH:mm');
      }
    };

    const appendRepeat = () => {
      payload.repeatPeriodically = formValue.repeatPeriodically || false;
      payload.repeatAfterDays = formValue.repeatPeriodically ? formValue.repeatAfterDays : 0;
    };

    if (this.isTransactionSync()) {
      payload.oneTimeRun = formValue.oneTimeRun;
      payload.monthlyRun = formValue.monthlyRun;
      if (formValue.monthlyRun && formValue.monthRunDate) {
        payload.monthRunDateStr = this.formatDate(formValue.monthRunDate, 'MM/yyyy');
      } else {
        appendEndDate();
      }
      payload.repeatPeriodically = !formValue.oneTimeRun;
      payload.repeatAfterDays = formValue.oneTimeRun ? 0 : 1;
    } else if (this.isServiceNowSync()) {
      appendEndDate(); appendRepeat();
      payload.snowSyncUsers = formValue.snowSyncUsers;
      payload.snowSyncRoles = formValue.snowSyncRoles;
      payload.snowSyncGroups = formValue.snowSyncGroups;
      payload.snowSyncUserRoles = formValue.snowSyncUserRoles;
      payload.snowActiveUsersOnly = formValue.snowActiveUsersOnly;
      payload.snowDeleteOrphans = formValue.snowDeleteOrphans;
      payload.snowMaxRecords = formValue.snowMaxRecords || 0;
    } else if (this.isCISSync()) {
      appendEndDate(); appendRepeat();
      payload.cisSyncUsers = formValue.cisSyncUsers;
      payload.cisSyncGroups = formValue.cisSyncGroups;
      payload.cisActiveUsersOnly = formValue.cisActiveUsersOnly;
      payload.cisDeleteOrphans = formValue.cisDeleteOrphans;
    } else if (this.isIdentityCorrelation()) {
      appendEndDate(); appendRepeat();
      payload.correlationIncludeAd = this.selectedAdIds.length > 0;
      payload.correlationIncludeAzure = this.selectedAzureIds.length > 0;
      payload.correlationIncludeCis = this.selectedCisIds.length > 0;
      payload.correlationIncludeSnow = this.selectedSnowIds.length > 0;
      payload.correlationIncludeSap = this.selectedSapIds.length > 0;
      payload.correlationAdIds = this.joinIds(this.selectedAdIds);
      payload.correlationAzureIds = this.joinIds(this.selectedAzureIds);
      payload.correlationCisIds = this.joinIds(this.selectedCisIds);
      payload.correlationSnowIds = this.joinIds(this.selectedSnowIds);
      payload.correlationSapIds = this.joinIds(this.selectedSapIds);
    } else if (this.isAuditLogSync()) {
      appendEndDate();
      payload.repeatPeriodically = true;
      payload.repeatIntervalMinutes = formValue.repeatIntervalMinutes || 60;
      payload.repeatAfterDays = 0;
    } else if (this.isAnomalyDetection()) {
      appendEndDate(); appendRepeat();
      payload.analysisWindowDays = formValue.analysisWindowDays || 30;
    } else if (this.isRoleSync()) {
      appendEndDate(); appendRepeat();
      payload.abapPageSize = formValue.abapPageSize || 5000;
      payload.roleSyncOrgValues = formValue.roleSyncOrgValues || false;
    } else if (this.isAbapProgramSync() || this.isUserRoleSync() || this.isTstctSync() || this.isFirefighterLogSync()) {
      appendEndDate(); appendRepeat();
      payload.abapPageSize = formValue.abapPageSize || 5000;
    } else {
      appendEndDate(); appendRepeat();
    }
  }

  private extractValidationErrors(response: ApiResponse | null | undefined): string | null {
    if (!response?.data || typeof response.data !== 'object') return null;
    const errors: string[] = [];
    for (const [, message] of Object.entries(response.data)) {
      if (typeof message === 'string') errors.push(message);
    }
    return errors.length > 0 ? errors.join('; ') : null;
  }

  close(): void {
    this.modal.close(false);
  }
}
