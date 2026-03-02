import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CamService } from '../../cam.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { ApiResponse } from '../../../../core/models/api-response';
import { TableColumn, TableAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ViewJobConfigComponent } from './view-job-config/view-job-config.component';

@Component({
  standalone: false,
  selector: 'app-uar-jobs',
  templateUrl: './uar-jobs.component.html',
})
export class UarJobsComponent implements OnInit {
  loading = false;
  data: any[] = [];
  totalRecords = 0;
  selectedRows: any[] = [];

  private sortFieldMap: Record<string, string> = { sapName: 'sapId' };
  private currentParams: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { field: 'id', header: 'ID', width: '70px', sortable: true },
    { field: 'sapName', header: 'System', width: '120px', sortable: true, filterable: true },
    { field: 'description', header: 'Description', sortable: true, filterable: true, ellipsis: true },
    { field: 'runTime', header: 'Start Time', width: '110px' },
    { field: 'startDate', header: 'Start Date', width: '120px' },
    { field: 'endDate', header: 'End Date', width: '120px' },
    { field: 'createdDate', header: 'Created Date', width: '120px' },
    { field: 'createdBy', header: 'Created By', width: '120px', sortable: true, filterable: true },
    { field: 'repeatType', header: 'Period Type', width: '120px', sortable: true },
    { field: 'statusText', header: 'Status', type: 'tag', width: '120px', sortable: true,
      tagColors: { 'Completed': 'green', 'Running': 'blue', 'Scheduled': 'cyan', 'Error': 'red', 'Aborted': 'orange', default: 'default' } },
  ];

  actions: TableAction[] = [
    { label: 'Add', icon: 'plus-circle', command: () => this.onAdd() },
    { label: 'Job Config', icon: 'setting', command: () => this.onJobConfig() },
    { label: 'Abort', icon: 'close-circle', command: () => this.onAbort(), danger: true },
    { label: 'User Batch', icon: 'team', command: () => this.onUserBatch() },
    { label: 'Ad-Hoc', icon: 'thunderbolt', command: () => this.onAdHoc() },
  ];

  constructor(
    private camService: CamService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private modal: NzModalService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  onQueryChange(params: TableQueryParams): void {
    this.currentParams = params;
    this.loadData(params);
  }

  onSelectionChange(rows: any[]): void {
    this.selectedRows = rows;
  }

  private loadData(params: TableQueryParams): void {
    this.loading = true;
    const sortField = params.sort?.field || '';
    const apiParams = {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sortField: this.sortFieldMap[sortField] || sortField,
      sortOrder: params.sort?.direction === 'descend' ? -1 : 1,
      filters: params.filters || {},
    };

    this.camService.getArcJob(apiParams).subscribe({
      next: (resp: ApiResponse) => {
        this.data = resp.data?.rows || [];
        this.totalRecords = resp.data?.records || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  private getSelectedRow(): any | null {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notificationService.error('Please select a row');
      return null;
    }
    return this.selectedRows[0];
  }

  private onAdd(): void {
    this.router.navigate(['/cam/user-access-review/uar-jobs/add']);
  }

  private onJobConfig(): void {
    const row = this.getSelectedRow();
    if (!row) return;
    this.modal.create({
      nzTitle: 'Job Configuration',
      nzContent: ViewJobConfigComponent,
      nzWidth: '600px',
      nzData: { id: row.id },
      nzFooter: null,
      nzClassName: 'updated-modal',
    });
  }

  private onAbort(): void {
    const row = this.getSelectedRow();
    if (!row) return;

    this.confirmDialogService.confirm({
      title: 'Abort Job',
      message: 'Abort the active review jobs?',
      checkbox: true,
    }).subscribe(resp => {
      if (resp) {
        this.camService.abortTasks(row.id, resp.checkboxValue).subscribe((apiResp: ApiResponse) => {
          this.notificationService.show(apiResp);
          if (this.currentParams) this.loadData(this.currentParams);
        });
      }
    });
  }

  private onUserBatch(): void {
    const row = this.getSelectedRow();
    if (!row) return;
    this.router.navigate(['/cam/user-access-review/review-user-batch'], { state: { batchID: row.id } });
  }

  private onAdHoc(): void {
    const row = this.getSelectedRow();
    if (!row) return;
    if (row.statusText !== 'Error') {
      this.notificationService.error('Can only Ad-Hoc Scheduled and Error Jobs.');
    }
  }
}
