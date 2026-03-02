import { Component, OnInit, OnDestroy } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { DataSyncService, SyncJob } from '../data-sync.service';
import { JobLogsDialogComponent } from '../job-logs-dialog/job-logs-dialog.component';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ApiResponse } from '../../../../core/models/api-response';

@Component({
  standalone: false,
  selector: 'app-sync-jobs',
  templateUrl: './sync-jobs.component.html',
  styleUrls: ['./sync-jobs.component.scss'],
})
export class SyncJobsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  columns: TableColumn[] = [
    { field: 'schedulerName', header: 'Scheduler', sortable: true, filterable: true },
    { field: 'syncType', header: 'Sync Type', sortable: true, filterable: true },
    { field: 'syncMode', header: 'Mode', sortable: true },
    { field: 'sapSystem', header: 'SAP System', sortable: true },
    { field: 'status', header: 'Status', sortable: true, filterable: true },
    { field: 'startedOnStr', header: 'Started', sortable: true },
    { field: 'completedOnStr', header: 'Completed', sortable: true },
    { field: 'duration', header: 'Duration' },
    { field: 'recordsExtracted', header: 'Extracted' },
    { field: 'recordsInserted', header: 'Inserted' },
    { field: 'recordsDeleted', header: 'Deleted' },
    { field: 'runBy', header: 'Run By', sortable: true },
  ];

  data: any[] = [];
  total = 0;
  loading = false;
  selectedRow: any = null;

  tableActions: TableAction[] = [
    { label: 'View Logs', icon: 'unordered-list', command: () => this.onViewLogs() },
  ];

  constructor(
    private nzModal: NzModalService,
    private notificationService: NotificationService,
    private dataSyncService: DataSyncService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryChange(params: TableQueryParams): void {
    this.loadJobs({
      first: (params.pageIndex - 1) * params.pageSize,
      rows: params.pageSize,
      sortField: params.sort?.field || 'startedOn',
      sortOrder: params.sort?.direction === 'ascend' ? 1 : -1,
      filters: params.filters || {},
    });
  }

  loadJobs(tableEvent?: any): void {
    this.loading = true;

    this.dataSyncService.getJobs(tableEvent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: ApiResponse) => {
          if (resp.success && resp.data) {
            const jobs = resp.data.rows || [];
            this.data = jobs.map((job: any) => ({
              ...job,
              schedulerName: job.profileName || 'Manual',
            }));
            this.total = resp.data.records || jobs.length;
          }
          this.loading = false;
        },
        error: () => {
          this.notificationService.error('Failed to load jobs');
          this.loading = false;
        },
      });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  onViewLogs(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a job first');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Job Execution Logs',
      nzContent: JobLogsDialogComponent,
      nzWidth: '60vw',
      nzBodyStyle: { maxHeight: '80vh', overflow: 'auto' },
      nzClassName: 'updated-modal',
      nzData: { job: this.selectedRow },
      nzFooter: null,
    });
  }
}
