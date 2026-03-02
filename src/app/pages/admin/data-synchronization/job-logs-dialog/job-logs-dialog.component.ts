import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataSyncService, SyncJob, SyncJobLog } from '../data-sync.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response';

export interface JobLogsDialogData {
  job: SyncJob;
}

@Component({
  standalone: false,
  selector: 'app-job-logs-dialog',
  templateUrl: './job-logs-dialog.component.html',
  styleUrls: ['./job-logs-dialog.component.scss']
})
export class JobLogsDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  job: SyncJob;
  logs: SyncJobLog[] = [];
  loading = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: JobLogsDialogData,
    public modal: NzModalRef,
    private dataSyncService: DataSyncService,
    private notificationService: NotificationService
  ) {
    this.job = this.dialogData.job;
  }

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLogs(): void {
    this.loading = true;

    this.dataSyncService.getJobLogs(this.job.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            this.logs = resp.data;
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load job logs');
          this.loading = false;
        }
      });
  }

  formatDateTime(dateValue: any): string {
    if (!dateValue) return '-';
    const date = new Date(dateValue);
    return date.toLocaleString();
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'COMPLETED': 'job-logs__status--success',
      'ERROR': 'job-logs__status--error',
      'PARTIAL': 'job-logs__status--warning',
      'IN_PROGRESS': 'job-logs__status--info'
    };
    return classMap[status] || 'job-logs__status--default';
  }

  close(): void {
    this.modal.close();
  }
}
