import { Component, OnInit, ViewChild, TemplateRef, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { TableColumn, TableAction, RowAction, TableQueryParams } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ApprovalDetailsComponent } from '../approval-details/approval-details.component';

@Component({
  standalone: false,
  selector: 'app-wf-all-requests',
  templateUrl: './all-requests.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class WfAllRequestsComponent implements OnInit {
  @ViewChild('logsModalTpl', { static: true }) logsModalTpl!: TemplateRef<any>;

  data: any[] = [];
  totalRecords = 0;
  loading = true;
  requestLogs: any[] = [];

  search: any = {};
  requestTypes: string[] = [];
  statuses: string[] = [];
  lastQuery: TableQueryParams | null = null;

  columns: TableColumn[] = [
    { header: 'Request ID', field: 'id', sortable: true, width: '110px' },
    { header: 'Request Type', field: 'requestTypeName', sortable: true, type: 'tag',
      tagColors: { 'Add Users': 'blue', 'Change Users': 'cyan', 'Lock Users': 'orange', 'Reset Password': 'purple', 'Delete Users': 'red', default: 'default' } },
    { header: 'Requester', field: 'requesterName', sortable: true },
    { header: 'Request Date', field: 'requestDateStr', type: 'date', dateFormat: 'yyyy-MM-dd', sortable: true, width: '130px' },
    { header: 'Cancel Date', field: 'cancelDate', type: 'date', dateFormat: 'yyyy-MM-dd', sortable: true, width: '130px' },
    { header: 'Canceler', field: 'cancellerName', sortable: true },
    { header: 'Status', field: 'statusText', sortable: true, type: 'tag', width: '120px',
      tagColors: { 'Created': 'blue', 'Progress': 'processing', 'Completed': 'green', 'Rejected': 'red', 'Cancelled': 'default', default: 'default' } },
    { header: 'Actions', field: 'actions', type: 'actions', width: '160px',
      actions: this.getRowActions() },
  ];

  actions: TableAction[] = [
    { label: 'Export', icon: 'download', command: () => this.exportExcel() },
  ];

  constructor(
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private confirmDialogService: ConfirmDialogService,
    private fileSaverService: FileSaverService,
    private modalService: NzModalService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  private getRowActions(): RowAction[] {
    return [
      { icon: 'eye', tooltip: 'View Approval Status', command: (row) => this.viewApprovalStatus(row) },
      { icon: 'file-search', tooltip: 'View Request Details', command: (row) => this.viewRequestDetails(row) },
      { icon: 'close-circle', tooltip: 'Cancel Request', command: (row) => this.cancelRequest(row),
        hidden: (row) => row.status !== 'Created', danger: true },
      { icon: 'unordered-list', tooltip: 'View Logs', command: (row) => this.viewRequestLogs(row) },
    ];
  }

  loadData(event: TableQueryParams): void {
    this.lastQuery = event;
    this.loading = true;
    this.workflowService.getAllRequests(event, this.search).subscribe({
      next: (resp) => {
        const page = resp.data?.page || {};
        this.data = page.content || [];
        this.totalRecords = page.totalElements || 0;
        if (resp.data?.requestTypes) this.requestTypes = resp.data.requestTypes;
        if (resp.data?.statuses) this.statuses = resp.data.statuses;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void {
    if (this.lastQuery) {
      this.lastQuery.pageIndex = 1;
      this.loadData(this.lastQuery);
    }
  }

  resetSearch(): void {
    this.search = {};
    this.onSearch();
  }

  viewApprovalStatus(row: any): void {
    this.modalService.create({
      nzTitle: 'Approval Status',
      nzContent: ApprovalDetailsComponent,
      nzData: { id: row.id },
      nzWidth: 800,
      nzFooter: null,
    });
  }

  viewRequestDetails(row: any): void {
    this.router.navigate(['/cam/workflow/request-details', row.id, row.status]);
  }

  cancelRequest(row: any): void {
    this.confirmDialogService.confirm({
      title: 'Cancel Request',
      message: `Are you sure you want to cancel request #${row.id}?`,
      confirmBtnText: 'Cancel Request',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.workflowService.cancelRequest(row.id).subscribe({
          next: (resp) => { this.notificationService.show(resp); this.onSearch(); },
          error: (err) => this.notificationService.handleHttpError(err),
        });
      }
    });
  }

  viewRequestLogs(row: any): void {
    this.requestLogs = [];
    this.workflowService.getRequestLogs(row.id).subscribe({
      next: (resp) => {
        this.requestLogs = resp.data || [];
        this.modalService.create({
          nzTitle: `Request Logs — #${row.id}`,
          nzContent: this.logsModalTpl,
          nzWidth: 640,
          nzFooter: null,
        });
      },
    });
  }

  exportExcel(): void {
    this.workflowService.exportAllRequests(this.search).subscribe({
      next: (resp) => this.fileSaverService.saveAnyFile(resp, 'All_Requests.xlsx'),
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }
}
