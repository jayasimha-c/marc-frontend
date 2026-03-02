import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { CamService } from '../../../cam.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { FileSaverService } from '../../../../../core/services/file-saver.service';
import { ApiResponse } from '../../../../../core/models/api-response';
import { TableColumn, TableAction, TableQueryParams } from '../../../../../shared/components/advanced-table/advanced-table.models';

@Component({
  standalone: false,
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
})
export class UserListComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileAttachments') fileAttachments!: ElementRef<HTMLInputElement>;

  signOff = false;
  taskId = '';
  userId: string | null = null;
  comment = '';
  attachmentId: any = null;

  // --- Users table ---
  userData: any[] = [];
  userTotal = 0;
  userLoading = false;
  selectedUsers: any[] = [];
  userActions: TableAction[] = [];
  private currentUserParams: TableQueryParams | null = null;

  userColumns: TableColumn[] = [
    { field: 'userId', header: 'User ID', sortable: true, filterable: true },
    { field: 'username', header: 'User Name', sortable: true, filterable: true },
    { field: 'group', header: 'Group', sortable: true },
    { field: 'validFrom', header: 'Valid From', type: 'date', width: '110px', sortable: true },
    { field: 'validTo', header: 'Valid To', type: 'date', width: '110px', sortable: true },
    { field: 'statusText', header: 'Status', type: 'tag', width: '130px',
      tagColors: { 'Approved': 'green', 'Rejected': 'red', 'Hold': 'purple', 'Expired': 'orange', 'Unreviewed': 'blue', default: 'default' } },
  ];

  // --- Roles table ---
  rolesData: any[] = [];
  rolesTotal = 0;
  rolesColumns: TableColumn[] = [
    { field: 'roleId', header: 'Role', sortable: true },
    { field: 'validFrom', header: 'Valid From', type: 'date', width: '110px' },
    { field: 'validTo', header: 'Valid To', type: 'date', width: '110px' },
    { field: 'roleDesc', header: 'Description' },
    { field: 'composite', header: 'Composite', width: '100px' },
  ];

  // --- Transactions table ---
  transData: any[] = [];
  transTotal = 0;
  transColumns: TableColumn[] = [
    { field: 'txnId', header: 'Transaction', sortable: true },
    { field: 'txnDesc', header: 'Description' },
    { field: 'txnDate', header: 'Last Used Date', type: 'date', width: '130px' },
    { field: '_count', header: 'Count', width: '80px', align: 'center' },
  ];

  // --- Risk Violations table ---
  riskData: any[] = [];
  riskTotal = 0;
  riskColumns: TableColumn[] = [
    { field: 'bname', header: 'User ID', width: '100px' },
    { field: 'userName', header: 'User Name', width: '110px' },
    { field: 'userType', header: 'Type', width: '80px' },
    { field: 'userClass', header: 'User Group', width: '100px' },
    { field: 'businessProcess', header: 'Business Process' },
    { field: 'businessSubProcess', header: 'Sub Process' },
    { field: 'riskName', header: 'Risk', width: '100px' },
    { field: 'riskDesc', header: 'Risk Description' },
    { field: 'ruleName', header: 'Rule', width: '100px' },
    { field: 'mitigationName', header: 'Mitigation ID', width: '120px' },
  ];

  // --- Attachments table ---
  attachData: any[] = [];
  attachTotal = 0;
  attachActions: TableAction[] = [
    { label: 'Select Files...', icon: 'upload', command: () => this.fileAttachments?.nativeElement.click() },
  ];
  attachColumns: TableColumn[] = [
    { field: 'name', header: 'Attachment Name' },
    { field: 'uploadDate', header: 'Date', type: 'date', width: '140px' },
    {
      field: 'actions', header: 'Actions', type: 'actions', width: '100px', align: 'center',
      actions: [
        { icon: 'download', tooltip: 'Download', command: (row: any) => this.downloadAttachment(row) },
        { icon: 'delete', tooltip: 'Delete', danger: true, command: (row: any) => this.deleteAttachment(row) },
      ],
    },
  ];

  constructor(
    @Inject(NZ_MODAL_DATA) public dialogData: any,
    public modalRef: NzModalRef,
    private camService: CamService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private fileSaverService: FileSaverService,
  ) {
    this.taskId = this.dialogData.batchID;
    this.signOff = this.dialogData.signOff;

    if (this.signOff) {
      this.userActions = [
        { label: 'Sign-Off', icon: 'check-square', command: () => this.doSignOff() },
        { label: 'Sign-Off With Document', icon: 'upload', command: () => this.fileInput?.nativeElement.click() },
      ];
    } else {
      this.camService.getArcUsersListRequiredInfo(this.taskId).subscribe((resp: ApiResponse) => {
        const actions: TableAction[] = [];
        if (resp.data?.actionsVisible) {
          actions.push(
            { label: 'Approve', icon: 'check', command: () => this.changeStatus(1) },
            { label: 'Reject', icon: 'close', command: () => this.changeStatus(-1) },
            { label: 'Hold', icon: 'pause', command: () => this.changeStatus(2) },
            { label: 'Export', icon: 'export', command: () => this.exportReport() },
          );
        }
        if (resp.data?.attachment) {
          this.attachmentId = resp.data.attachment;
          actions.push({ label: 'Download Guide', icon: 'file-text', command: () => this.downloadGuide() });
        }
        this.userActions = actions;
      });
    }
  }

  // --- Users table ---
  onUserQueryChange(params: TableQueryParams): void {
    this.currentUserParams = params;
    this.loadUsers(params);
  }

  onUserSelectionChange(rows: any[]): void {
    this.selectedUsers = rows;
    if (rows.length > 0) {
      const lastRow = rows[rows.length - 1];
      this.userId = lastRow.id;
      this.loadUserDetails();
    }
  }

  onUserRowClick(row: any): void {
    this.userId = row.id;
    this.loadUserDetails();
  }

  private loadUsers(params: TableQueryParams): void {
    this.userLoading = true;
    const apiParams = {
      pageIndex: params.pageIndex,
      pageSize: params.pageSize,
      sortField: params.sort?.field || '',
      sortOrder: params.sort?.direction === 'descend' ? -1 : 1,
      filters: params.filters || {},
    };
    this.camService.getArcUserList(apiParams, this.taskId, this.signOff).subscribe({
      next: (resp: ApiResponse) => {
        this.userData = resp.data?.rows || [];
        this.userTotal = resp.data?.records || 0;
        this.userLoading = false;
      },
      error: () => { this.userLoading = false; },
    });
  }

  private loadUserDetails(): void {
    if (!this.userId) return;
    const defaultParams = { pageIndex: 1, pageSize: 100, sortField: '', sortOrder: 1, filters: {} };
    this.camService.getArcRoles(defaultParams, this.userId).subscribe((resp: ApiResponse) => {
      this.rolesData = resp.data?.rows || [];
      this.rolesTotal = resp.data?.records || 0;
    });
    this.camService.getArcTransactions(defaultParams, this.userId).subscribe((resp: ApiResponse) => {
      this.transData = resp.data?.rows || [];
      this.transTotal = resp.data?.records || 0;
    });
    this.camService.getArcRiskViolations(defaultParams, this.userId).subscribe((resp: ApiResponse) => {
      this.riskData = resp.data?.rows || [];
      this.riskTotal = resp.data?.records || 0;
    });
    this.camService.getArcAttachments(this.userId).subscribe((resp: ApiResponse) => {
      this.attachData = resp.data?.rows || [];
      this.attachTotal = resp.data?.records || 0;
    });
    this.camService.getArcComments(this.userId).subscribe((resp: ApiResponse) => {
      this.comment = resp.data || '';
    });
  }

  // --- Status actions ---
  changeStatus(status: number): void {
    if (!this.selectedUsers.length) {
      this.notificationService.error('Please select at least one user');
      return;
    }
    const labels: Record<number, string> = { 1: 'approving', [-1]: 'rejecting', 2: 'holding' };
    this.confirmDialog.confirm({
      title: 'Confirm',
      message: `Please confirm before ${labels[status]}`,
      confirmBtnText: 'Ok',
    }).subscribe(confirmed => {
      if (!confirmed) return;
      const ids = this.selectedUsers.map(r => r.id).join(',');
      this.camService.changeTaskStatus(status, ids).subscribe((resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.success(resp.message);
          this.selectedUsers = [];
          if (this.currentUserParams) this.loadUsers(this.currentUserParams);
        }
      });
    });
  }

  // --- Sign-off ---
  doSignOff(): void {
    this.camService.signOffTask(this.taskId).subscribe((resp: ApiResponse) => {
      if (resp.success) {
        this.notificationService.success(resp.data);
        if (this.currentUserParams) this.loadUsers(this.currentUserParams);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('public_location', 'true');
    this.camService.signOffTaskWithDocument(this.taskId, fd).subscribe({
      next: (resp: ApiResponse) => {
        if (resp.success) {
          this.notificationService.success(resp.data);
          if (this.currentUserParams) this.loadUsers(this.currentUserParams);
        }
        input.value = '';
      },
      error: (err: any) => {
        this.notificationService.error(err.error?.message || 'Error uploading file');
        input.value = '';
      },
    });
  }

  // --- Attachments ---
  onTaskAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.userId) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', this.userId);
    this.camService.uploadTaskAttachment(fd).subscribe((resp: ApiResponse) => {
      if (resp.success) {
        this.notificationService.success(resp.message);
        this.camService.getArcAttachments(this.userId!).subscribe((r: ApiResponse) => {
          this.attachData = r.data?.rows || [];
          this.attachTotal = r.data?.records || 0;
        });
      }
    });
  }

  private downloadAttachment(row: any): void {
    this.camService.downloadArcAttachment(row.id).subscribe(resp => {
      this.fileSaverService.saveAnyFile(resp);
    });
  }

  private deleteAttachment(row: any): void {
    this.camService.deleteTaskAttachment(row.id).subscribe((resp: ApiResponse) => {
      if (resp.success) {
        this.notificationService.success(resp.data);
        if (this.userId) {
          this.camService.getArcAttachments(this.userId).subscribe((r: ApiResponse) => {
            this.attachData = r.data?.rows || [];
            this.attachTotal = r.data?.records || 0;
          });
        }
      }
    });
  }

  // --- Comments ---
  saveComments(): void {
    if (!this.userId) return;
    this.camService.saveTaskComments({ id: this.userId, comemnts: this.comment }).subscribe((resp: ApiResponse) => {
      if (resp.success) this.notificationService.success(resp.message);
    });
  }

  // --- Guide & Export ---
  private downloadGuide(): void {
    if (!this.attachmentId) return;
    this.camService.downloadArcGuide(this.attachmentId).subscribe(resp => {
      this.fileSaverService.saveAnyFile(resp);
    });
  }

  private exportReport(): void {
    this.notificationService.info('Preparing your report, please wait...');
    this.camService.getExportArcReviewUsers(this.taskId).subscribe(resp => {
      this.fileSaverService.saveAnyFile(resp);
    });
  }
}
