import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { CssMonitoringService } from '../css-monitoring.service';
import { getRuleTypeLabel } from '../../btp/btp.model';
import { JobLogsDialogComponent } from './job-logs-dialog/job-logs-dialog.component';

@Component({
  standalone: false,
  selector: 'app-job-history',
  templateUrl: './job-history.component.html',
})
export class JobHistoryComponent implements OnInit {
  jobStats = {
    totalJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    partialJobs: 0,
  };

  data: any[] = [];
  totalRecords = 0;
  selectedRow: any = null;
  loading = false;

  schedulerId: number | null = null;
  schedulerName = '';
  ruleBookName = '';

  columns: TableColumn[] = [
    { field: 'id', header: 'Job ID', type: 'text' },
    { field: 'ruleBookName', header: 'Rule Book', type: 'text' },
    { field: 'ruleTypeDisplay', header: 'Rule Type', type: 'text' },
    { field: 'sapSystem', header: 'SAP System', type: 'text' },
    { field: 'startedOnStr', header: 'Started On', type: 'text' },
    { field: 'completedOnStr', header: 'Completed On', type: 'text' },
    {
      field: 'statusDisplay', header: 'Status', type: 'tag',
      tagColors: {
        COMPLETED: 'green', SUCCESS: 'green',
        FAILED: 'red', ERROR: 'red',
        IN_PROGRESS: 'blue', RUNNING: 'blue',
        PARTIAL: 'orange', WARNING: 'orange',
      },
    },
    { field: 'rulesExecuted', header: 'Rules Executed', type: 'text' },
    { field: 'violationsFound', header: 'Violations', type: 'text' },
    { field: 'runBy', header: 'Run By', type: 'text' },
  ];

  actions: TableAction[] = [
    { label: 'View Logs', icon: 'file-text', type: 'primary', command: () => this.openLogsDialog() },
    { label: 'Refresh', icon: 'reload', command: () => this.onRefresh() },
  ];

  constructor(
    private cssMonitoringService: CssMonitoringService,
    private notificationService: NotificationService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private nzModal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params) => {
      if (params['schedulerId']) {
        this.schedulerId = +params['schedulerId'];
        this.schedulerName = params['schedulerName'] || '';
      }
      if (params['ruleBookName']) {
        this.ruleBookName = params['ruleBookName'];
      }
      this.loadData();
      this.loadStats();
    });
  }

  get title(): string {
    if (this.ruleBookName) return `Job History - ${this.ruleBookName}`;
    if (this.schedulerName) return `Job History - ${this.schedulerName}`;
    return 'Job History';
  }

  loadData(): void {
    this.loading = true;
    if (this.schedulerId) {
      this.cssMonitoringService.getJobsByScheduler(this.schedulerId).subscribe({
        next: (resp) => {
          this.data = resp.data?.rows || [];
          this.totalRecords = resp.data?.records || 0;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else {
      this.cssMonitoringService.getAllJobs().subscribe({
        next: (resp) => {
          let rows = resp.data?.rows || [];
          if (this.ruleBookName) {
            rows = rows.filter((job: any) => job.ruleBookName === this.ruleBookName);
          }
          this.data = rows;
          this.totalRecords = rows.length;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }

  loadStats(): void {
    this.cssMonitoringService.getJobStats().subscribe({
      next: (resp) => {
        if (resp.data) this.jobStats = resp.data;
      },
    });
  }

  onRefresh(): void {
    this.loadData();
    this.loadStats();
  }

  onRowClicked(row: any): void {
    this.selectedRow = row;
  }

  goBack(): void {
    this.router.navigate(['sap-rule-book'], { relativeTo: this.activeRoute.parent });
  }

  openLogsDialog(): void {
    if (!this.selectedRow) {
      this.notificationService.error('Please select a job first');
      return;
    }
    this.nzModal.create({
      nzTitle: 'Job Logs',
      nzContent: JobLogsDialogComponent,
      nzWidth: '800px',
      nzData: { job: this.selectedRow },
      nzBodyStyle: { maxHeight: '85vh', overflow: 'auto' },
      nzFooter: null,
    });
  }
}
