import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiResponse } from '../../../../core/models/api-response';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ServiceNowService, SnowSyncConfig, SnowSyncLog } from '../servicenow.service';

@Component({
  standalone: false,
  selector: 'app-servicenow-sync-settings',
  templateUrl: './sync-settings.component.html',
  styleUrls: ['./sync-settings.component.scss']
})
export class ServiceNowSyncSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  systems: any[] = [];
  selectedSystemId: number | null = null;
  configForm!: FormGroup;
  config: SnowSyncConfig | null = null;
  syncStats: any = null;

  // Sync logs
  logsData: any[] = [];
  logsTotal = 0;
  logsColumns: TableColumn[] = [
    { field: 'startTime', header: 'Start Time', sortable: true, width: '160px' },
    { field: 'syncType', header: 'Type', sortable: true, width: '120px' },
    { field: 'status', header: 'Status', sortable: true, width: '100px' },
    { field: 'durationFormatted', header: 'Duration', width: '100px' },
    { field: 'totalRecords', header: 'Records', width: '100px' },
    { field: 'triggeredBy', header: 'Triggered By', width: '120px' }
  ];

  loading = false;
  saving = false;
  syncRunning = false;

  days = Array.from({ length: 32 }, (_, i) => i);
  hours = Array.from({ length: 24 }, (_, i) => i);
  mins = Array.from({ length: 60 }, (_, i) => i);

  constructor(
    private fb: FormBuilder,
    private servicenowService: ServiceNowService,
    private notificationService: NotificationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadSystems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      enabled: [false],
      syncUsers: [true],
      syncRoles: [true],
      syncGroups: [true],
      syncUserRoles: [true],
      incrementalDays: [0],
      incrementalHours: [0],
      incrementalMins: [30],
      incrementalCron: [''],
      useCustomIncrementalCron: [false],
      fullSyncDays: [1],
      fullSyncHours: [2],
      fullSyncMins: [0],
      fullSyncCron: [''],
      useCustomFullSyncCron: [false],
      pageSize: [1000, [Validators.min(100), Validators.max(10000)]],
      maxRecords: [0, [Validators.min(0)]],
      activeUsersOnly: [false],
      deleteOrphans: [true],
      retryCount: [3, [Validators.min(0), Validators.max(10)]],
      retryDelaySeconds: [60, [Validators.min(10), Validators.max(600)]]
    });
  }

  loadSystems(): void {
    this.loading = true;
    this.servicenowService.getServiceNowSystems()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.systems = resp.data;
            if (this.systems.length > 0 && !this.selectedSystemId) {
              this.selectedSystemId = this.systems[0].id;
              this.onSystemChange();
            }
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load ServiceNow systems');
          this.loading = false;
        }
      });
  }

  onSystemChange(): void {
    if (!this.selectedSystemId) return;
    this.loading = true;
    this.loadConfig();
    this.loadStats();
    this.loadLogs();
  }

  private loadConfig(): void {
    this.servicenowService.getConfig(this.selectedSystemId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.config = resp.data;
            this.populateForm(this.config!);
          }
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
  }

  private loadStats(): void {
    this.servicenowService.getSyncStats(this.selectedSystemId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.syncStats = resp.data;
            this.syncRunning = resp.data.syncRunning || false;
          }
        }
      });
  }

  private loadLogs(): void {
    this.servicenowService.getSyncLogs(this.selectedSystemId!, 0, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const pageData = resp.data;
            this.logsData = (pageData.content || []).map((log: SnowSyncLog) => ({
              ...log,
              durationFormatted: this.formatDuration(log.durationMs),
              totalRecords: this.getTotalRecords(log)
            }));
            this.logsTotal = pageData.totalElements || 0;
          }
        }
      });
  }

  private populateForm(config: SnowSyncConfig): void {
    const incrementalSchedule = this.parseCronToSchedule(config.incrementalCron);
    const fullSyncSchedule = this.parseCronToSchedule(config.fullSyncCron);

    this.configForm.patchValue({
      enabled: config.enabled,
      syncUsers: config.syncUsers,
      syncRoles: config.syncRoles,
      syncGroups: config.syncGroups,
      syncUserRoles: config.syncUserRoles,
      incrementalDays: incrementalSchedule.days,
      incrementalHours: incrementalSchedule.hours,
      incrementalMins: incrementalSchedule.mins,
      incrementalCron: config.incrementalCron || '',
      useCustomIncrementalCron: !!config.incrementalCron && !this.isSimpleCron(config.incrementalCron),
      fullSyncDays: fullSyncSchedule.days,
      fullSyncHours: fullSyncSchedule.hours,
      fullSyncMins: fullSyncSchedule.mins,
      fullSyncCron: config.fullSyncCron || '',
      useCustomFullSyncCron: !!config.fullSyncCron && !this.isSimpleCron(config.fullSyncCron),
      pageSize: config.pageSize,
      maxRecords: config.maxRecords,
      activeUsersOnly: config.activeUsersOnly,
      deleteOrphans: config.deleteOrphans,
      retryCount: config.retryCount,
      retryDelaySeconds: config.retryDelaySeconds
    });
  }

  saveConfig(): void {
    if (!this.selectedSystemId || !this.configForm.valid) return;

    this.saving = true;
    const fv = this.configForm.value;

    let incrementalCron = fv.incrementalCron;
    if (!fv.useCustomIncrementalCron) {
      incrementalCron = this.buildCronFromSchedule(fv.incrementalDays, fv.incrementalHours, fv.incrementalMins);
    }

    let fullSyncCron = fv.fullSyncCron;
    if (!fv.useCustomFullSyncCron) {
      fullSyncCron = this.buildCronFromSchedule(fv.fullSyncDays, fv.fullSyncHours, fv.fullSyncMins);
    }

    const config: SnowSyncConfig = {
      systemId: this.selectedSystemId,
      enabled: fv.enabled,
      syncUsers: fv.syncUsers,
      syncRoles: fv.syncRoles,
      syncGroups: fv.syncGroups,
      syncUserRoles: fv.syncUserRoles,
      incrementalCron,
      fullSyncCron,
      pageSize: fv.pageSize,
      maxRecords: fv.maxRecords,
      activeUsersOnly: fv.activeUsersOnly,
      deleteOrphans: fv.deleteOrphans,
      retryCount: fv.retryCount,
      retryDelaySeconds: fv.retryDelaySeconds
    };

    this.servicenowService.saveConfig(config)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success('Configuration saved successfully');
            this.loadConfig();
          } else {
            this.notificationService.error(resp.message || 'Failed to save');
          }
          this.saving = false;
        },
        error: () => {
          this.notificationService.error('Failed to save configuration');
          this.saving = false;
        }
      });
  }

  triggerIncrementalSync(): void {
    if (!this.selectedSystemId || this.syncRunning) return;

    this.syncRunning = true;
    this.servicenowService.triggerIncrementalSync(this.selectedSystemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success('Incremental sync completed');
            this.loadStats();
            this.loadLogs();
          } else {
            this.notificationService.error(resp.message || 'Sync failed');
          }
          this.syncRunning = false;
        },
        error: () => {
          this.notificationService.error('Sync failed');
          this.syncRunning = false;
        }
      });
  }

  triggerFullSync(): void {
    if (!this.selectedSystemId || this.syncRunning) return;

    this.syncRunning = true;
    this.servicenowService.triggerFullSync(this.selectedSystemId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success) {
            this.notificationService.success('Full sync completed');
            this.loadStats();
            this.loadLogs();
          } else {
            this.notificationService.error(resp.message || 'Sync failed');
          }
          this.syncRunning = false;
        },
        error: () => {
          this.notificationService.error('Sync failed');
          this.syncRunning = false;
        }
      });
  }

  refreshStatus(): void {
    this.loadStats();
    this.loadLogs();
  }

  private formatDuration(ms: number | undefined): string {
    if (!ms) return '—';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const rem = seconds % 60;
    return minutes > 0 ? `${minutes}m ${rem}s` : `${seconds}s`;
  }

  private getTotalRecords(log: SnowSyncLog): number {
    return (log.usersSynced || 0) + (log.rolesSynced || 0) +
           (log.groupsSynced || 0) + (log.userRolesSynced || 0);
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'SUCCESS': 'success', 'FAILED': 'error', 'PARTIAL': 'warning',
      'IN_PROGRESS': 'processing', 'STARTED': 'processing', 'CANCELLED': 'default'
    };
    return map[status] || 'default';
  }

  getSyncTypeColor(type: string): string {
    const map: Record<string, string> = { 'FULL': 'purple', 'INCREMENTAL': 'blue', 'MANUAL': 'orange' };
    return map[type] || 'default';
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
