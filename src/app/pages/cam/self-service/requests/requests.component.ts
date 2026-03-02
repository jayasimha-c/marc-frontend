import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SelfServiceService } from '../services/self-service.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { TableColumn, TableAction, RowAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-ss-requests',
  templateUrl: './requests.component.html',
})
export class SsRequestsComponent implements OnInit {
  data: any[] = [];
  totalRecords = 0;
  loading = true;
  lastQuery: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { header: 'Request Type', field: 'job.operation', sortable: true, type: 'tag',
      tagColors: { 'Add Users': 'blue', 'Change Users': 'cyan', 'Lock Users': 'orange', 'Reset Password': 'purple', 'Delete Users': 'red', default: 'default' } },
    { header: 'Request Date', field: 'job.requestDate', type: 'date', dateFormat: 'yyyy-MM-dd HH:mm', sortable: true, width: '170px' },
    { header: 'Status', field: 'job.status', sortable: true, type: 'tag', width: '120px',
      tagColors: { 'Created': 'blue', 'Progress': 'processing', 'Completed': 'green', 'Rejected': 'red', 'Cancelled': 'default', default: 'default' } },
    { header: 'Actions', field: 'actions', type: 'actions', width: '120px',
      actions: this.getRowActions() },
  ];

  actions: TableAction[] = [
    { label: 'Export', icon: 'download', command: () => this.exportExcel() },
  ];

  constructor(
    private selfServiceService: SelfServiceService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private fileSaverService: FileSaverService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  private getRowActions(): RowAction[] {
    return [
      { icon: 'file-search', tooltip: 'View Request Details', command: (row) => this.viewDetails(row) },
      { icon: 'close-circle', tooltip: 'Cancel Request', command: (row) => this.cancelRequest(row),
        hidden: (row) => row.job?.status !== 'Created', danger: true },
    ];
  }

  loadData(event: TableQueryParams): void {
    this.lastQuery = event;
    this.loading = true;
    this.selfServiceService.getRequests(event).subscribe({
      next: (resp) => {
        const grid = resp.data || {};
        this.data = grid.rows || [];
        this.totalRecords = grid.records || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  viewDetails(row: any): void {
    this.router.navigate(['/cam/workflow/request-details', row.job?.id, row.job?.status]);
  }

  cancelRequest(row: any): void {
    this.confirmDialogService.confirm({
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this request?',
      confirmBtnText: 'Cancel Request',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.selfServiceService.cancelRequest(row.uuid).subscribe({
          next: (resp) => {
            this.notificationService.show(resp);
            if (resp.success && this.lastQuery) {
              this.lastQuery.pageIndex = 1;
              this.loadData(this.lastQuery);
            }
          },
          error: (err) => this.notificationService.handleHttpError(err),
        });
      }
    });
  }

  exportExcel(): void {
    this.selfServiceService.exportRequests().subscribe({
      next: (resp) => this.fileSaverService.saveAnyFile(resp, 'Self_Service_Requests.xlsx'),
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }
}
