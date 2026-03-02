import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CamService } from '../../cam.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { UserListComponent } from './user-list/user-list.component';

@Component({
  standalone: false,
  selector: 'app-review-jobs',
  templateUrl: './review-jobs.component.html',
})
export class ReviewJobsComponent implements OnInit {
  signOff = false;
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRows: any[] = [];

  dashboardMetrics = {
    totalJobs: 0,
    activeJobs: 0,
    totalUsers: 0,
    pendingReviews: 0,
  };

  columns: TableColumn[] = [
    { field: 'statusText', header: 'Status', type: 'tag', width: '130px', sortable: true,
      tagColors: { 'Completed': 'green', 'In Progress': 'blue', 'Expired': 'orange', 'Waiting For Sign-Off': 'purple', default: 'default' } },
    { field: 'desc', header: 'Job Description', sortable: true, filterable: true, ellipsis: true },
    { field: 'system', header: 'System', width: '120px', sortable: true, filterable: true },
    { field: 'users', header: 'Users', width: '80px', align: 'center', sortable: true },
    { field: 'progressDisplay', header: 'Progress', width: '140px' },
    { field: 'timelineDisplay', header: 'Timeline', width: '180px' },
    { field: 'batchID', header: 'Batch', width: '100px', sortable: true },
  ];

  actions: TableAction[] = [
    { label: 'User List', icon: 'unordered-list', command: () => this.openUserList(false) },
    { label: 'User Batch', icon: 'team', command: () => this.onUserBatch() },
  ];

  private currentParams: TableQueryParams | null = null;

  constructor(
    private modal: NzModalService,
    private camService: CamService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.camService.getArcReviewRequiredInfo().subscribe((resp: ApiResponse) => {
      this.signOff = resp.data?.signOffConfigured || false;
      if (this.signOff) {
        this.actions = [
          ...this.actions,
          { label: 'Sign-Off', icon: 'check-square', command: () => this.openUserList(true) },
        ];
      }
    });
  }

  onQueryChange(params: TableQueryParams): void {
    this.currentParams = params;
    this.loadData(params);
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  private loadData(params: TableQueryParams): void {
    this.loading = true;
    const apiParams = {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sortField: params.sort?.field || '',
      sortOrder: params.sort?.direction === 'descend' ? -1 : 1,
      filters: params.filters || {},
      globalFilter: params.globalSearch || '',
    };

    this.camService.getArcReview(apiParams, this.signOff).subscribe({
      next: (resp: ApiResponse) => {
        const rows = resp.data?.rows || [];
        this.processTableData(rows);
        this.data = rows;
        this.totalRecords = resp.data?.records || 0;
        this.calculateMetrics(rows);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private processTableData(jobs: any[]): void {
    jobs.forEach(job => {
      job.progressDisplay = this.getProgressDisplay(job);
      job.timelineDisplay = this.getTimelineDisplay(job);
    });
  }

  private calculateMetrics(jobs: any[]): void {
    this.dashboardMetrics.totalJobs = this.totalRecords;
    this.dashboardMetrics.totalUsers = jobs.reduce((sum, j) => sum + (parseInt(j.users, 10) || 0), 0);
    this.dashboardMetrics.activeJobs = jobs.filter(j => j.statusText?.toLowerCase().includes('progress')).length;
    this.dashboardMetrics.pendingReviews = jobs.reduce((sum, j) => sum + (parseInt(j.unreviewed, 10) || 0), 0);
  }

  private getProgressDisplay(job: any): string {
    const total = parseInt(job.users, 10) || 0;
    const reviewed = (parseInt(job.approved, 10) || 0) + (parseInt(job.rejected, 10) || 0)
      + (parseInt(job.expired, 10) || 0) + (parseInt(job.hold, 10) || 0);
    const pct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    return `${pct}% (${reviewed}/${total})`;
  }

  private getTimelineDisplay(job: any): string {
    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-';
    const start = fmt(job.date);
    const end = fmt(job.date1);

    if (job.date && job.date1) {
      const endDate = new Date(job.date1);
      const now = new Date();
      const startDate = new Date(job.date);
      const diffDays = Math.ceil(Math.abs(endDate.getTime() - startDate.getTime()) / 86400000);

      if (now > endDate) {
        return `${start} - ${end} (${diffDays}d, overdue)`;
      }
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86400000);
      if (daysLeft <= 3) {
        return `${start} - ${end} (${daysLeft}d left)`;
      }
      return `${start} - ${end} (${diffDays}d)`;
    }
    return `${start} - ${end}`;
  }

  private getSelectedRow(): any | null {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row');
      return null;
    }
    return this.selectedRows[0];
  }

  openUserList(signOff: boolean): void {
    const row = this.getSelectedRow();
    if (!row) return;

    if (signOff && row.taskStatus !== 5) {
      this.notificationService.error("Only jobs with 'Waiting For Sign-Off' status can be signed-off");
      return;
    }

    this.modal.create({
      nzTitle: signOff ? 'Sign-Off Review' : 'User List',
      nzContent: UserListComponent,
      nzWidth: '95vw',
      nzData: { batchID: row.batchID, signOff, jobData: row },
      nzFooter: null,
      nzClassName: 'updated-modal',
      nzStyle: { top: '20px' },
    }).afterClose.subscribe(result => {
      if (result === 'refresh' && this.currentParams) {
        this.loadData(this.currentParams);
      }
    });
  }

  private onUserBatch(): void {
    const row = this.getSelectedRow();
    if (!row) return;
    this.router.navigate(['/cam/user-access-review/review-user-batch'], { state: { batchID: row.batchID } });
  }
}
