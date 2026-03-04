import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, interval, takeUntil, takeWhile } from 'rxjs';
import { AbapService } from '../abap.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TableColumn, TableAction, TableQueryParams } from '../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-job-history',
  templateUrl: './job-history.component.html',
  styleUrls: ['./job-history.component.scss'],
})
export class JobHistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  schedulerId: number | null = null;

  private lastQueryParams: TableQueryParams | null = null;

  // Progress dialog
  showProgressModal = false;
  scanProgress: any = null;
  progressPollingActive = false;
  noProgressFound = false;

  // Logs dialog
  showLogsModal = false;
  jobLogs: any[] = [];
  logsLoading = false;

  columns: TableColumn[] = [
    { field: 'id', header: 'ID', width: '70px', sortable: false },
    { field: 'schedulerName', header: 'Scheduler', sortable: false },
    { field: 'sapSystemName', header: 'SAP System', width: '130px', sortable: false },
    { field: 'status', header: 'Status', width: '120px', sortable: false, type: 'tag',
      tagColors: {
        COMPLETED: 'green', FAILED: 'red', RUNNING: 'processing',
        PENDING: 'default', CANCELLED: 'orange',
      } },
    { field: 'startedOnStr', header: 'Started', width: '160px', sortable: false },
    { field: 'completedOnStr', header: 'Completed', width: '160px', sortable: false },
    { field: 'durationStr', header: 'Duration', width: '100px', sortable: false },
    { field: 'violationsFound', header: 'Violations', width: '100px', sortable: false },
    { field: 'programsScanned', header: 'Programs', width: '100px', sortable: false },
    { field: 'rulesExecuted', header: 'Rules', width: '80px', sortable: false },
    { field: 'runBy', header: 'Run By', width: '120px', sortable: false },
  ];

  actions: TableAction[] = [
    { label: 'View Progress', icon: 'hourglass', command: () => this.onViewProgress() },
    { label: 'View Logs', icon: 'file-text', command: () => this.onViewLogs() },
  ];

  constructor(
    private abapService: AbapService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['schedulerId']) {
        this.schedulerId = +params['schedulerId'];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onQueryParamsChange(params: TableQueryParams): void {
    this.lastQueryParams = params;
    this.loadData(params);
  }

  loadData(params?: TableQueryParams): void {
    const query = params || this.lastQueryParams;
    if (!query) return;

    this.loading = true;

    const req$ = this.schedulerId
      ? this.abapService.getJobsByScheduler(this.schedulerId, query)
      : this.abapService.getJobList(query);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.data = res.data?.rows || [];
          this.totalRecords = res.data?.records || 0;
        }
        this.loading = false;
      },
      error: () => {
        this.data = [];
        this.totalRecords = 0;
        this.loading = false;
      },
    });
  }

  onRowClick(row: any): void {
    this.selectedRow = row;
  }

  navigateBack(): void {
    this.router.navigate(['/sap-abap-scanner/scheduled-scans']);
  }

  // ==================== View Progress ====================

  onViewProgress(): void {
    if (!this.selectedRow) {
      this.notification.warn('Please select a job first');
      return;
    }
    const executionId = this.selectedRow.executionId;
    if (!executionId) {
      this.notification.warn('No execution linked to this job');
      return;
    }
    this.showProgressModal = true;
    this.scanProgress = null;
    this.progressPollingActive = true;
    this.noProgressFound = false;

    this.abapService.getScanProgress(executionId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resp) => {
        if (resp.success && resp.data) {
          this.scanProgress = resp.data;
          this.updateElapsedTime();

          const phase = this.scanProgress.phase;
          if (phase !== 'COMPLETED' && phase !== 'FAILED' && phase !== 'CANCELLED') {
            this.startProgressPolling(executionId);
          } else {
            this.progressPollingActive = false;
          }
        } else {
          this.progressPollingActive = false;
          this.noProgressFound = true;
        }
      },
      error: () => {
        this.progressPollingActive = false;
        this.noProgressFound = true;
      },
    });
  }

  private startProgressPolling(executionId: number): void {
    interval(1500)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => this.progressPollingActive && this.showProgressModal)
      )
      .subscribe(() => {
        this.abapService.getScanProgress(executionId).subscribe({
          next: (resp) => {
            if (resp.success && resp.data) {
              this.scanProgress = resp.data;
              this.updateElapsedTime();
              const phase = this.scanProgress.phase;
              if (phase === 'COMPLETED' || phase === 'FAILED' || phase === 'CANCELLED') {
                this.progressPollingActive = false;
              }
            }
          },
        });
      });
  }

  private updateElapsedTime(): void {
    if (this.scanProgress?.startedAt) {
      const startTime = new Date(this.scanProgress.startedAt).getTime();
      this.scanProgress.elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    }
  }

  closeProgressModal(): void {
    this.showProgressModal = false;
    this.progressPollingActive = false;
    this.scanProgress = null;
  }

  formatElapsedTime(seconds: number): string {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  getProgressStatus(): string {
    if (!this.scanProgress) return 'active';
    if (this.scanProgress.phase === 'FAILED') return 'exception';
    if (this.scanProgress.phase === 'COMPLETED') return 'success';
    return 'active';
  }

  getBatchPercent(): number {
    if (!this.scanProgress?.totalBatches) return 0;
    return Math.round((this.scanProgress.currentBatch / this.scanProgress.totalBatches) * 100);
  }

  // ==================== View Logs ====================

  onViewLogs(): void {
    if (!this.selectedRow) {
      this.notification.warn('Please select a job first');
      return;
    }
    this.showLogsModal = true;
    this.logsLoading = true;
    this.jobLogs = [];

    this.abapService.getJobLogs(this.selectedRow.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.logsLoading = false;
        if (res.success) {
          this.jobLogs = Array.isArray(res.data) ? res.data : (res.data?.rows || []);
        }
      },
      error: () => {
        this.logsLoading = false;
        this.notification.error('Failed to load job logs');
      },
    });
  }
}
