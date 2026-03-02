import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TableColumn, TableQueryParams, RowAction } from '../../../../shared/components/advanced-table/advanced-table.models';
import { ApprovalDetailsComponent } from '../approval-details/approval-details.component';
import { AddCommentComponent } from '../add-comment/add-comment.component';

@Component({
  standalone: false,
  selector: 'app-wf-to-approve',
  templateUrl: './to-approve.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class WfToApproveComponent implements OnInit {
  data: any[] = [];
  totalRecords = 0;
  loading = true;
  lastQuery: TableQueryParams | null = null;
  currentUserId: number = 0;

  columns: TableColumn[] = [
    { header: 'Request ID', field: 'job.id', sortable: true, width: '110px' },
    { header: 'Request Type', field: 'job.workflow.requestName', sortable: true, type: 'tag',
      tagColors: { 'Add Users': 'blue', 'Change Users': 'cyan', 'Lock Users': 'orange', 'Reset Password': 'purple', 'Delete Users': 'red', default: 'default' } },
    { header: 'Requester', field: 'job.requesterName', sortable: true },
    { header: 'Request Date', field: 'job.requestDate', type: 'date', dateFormat: 'yyyy-MM-dd', sortable: true, width: '130px' },
    { header: 'Approval Date', field: 'approvedDate', type: 'date', dateFormat: 'yyyy-MM-dd', sortable: true, width: '130px' },
    { header: 'Status', field: 'status', sortable: true, type: 'tag', width: '120px',
      tagColors: { 'Progress': 'processing', 'Approved': 'green', 'Rejected': 'red', default: 'default' } },
    { header: 'Actions', field: 'actions', type: 'actions', width: '180px',
      actions: this.getRowActions() },
  ];

  constructor(
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private modalService: NzModalService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    this.currentUserId = user?.id || 0;
  }

  private getRowActions(): RowAction[] {
    return [
      { icon: 'check-circle', tooltip: 'Approve', command: (row) => this.approveReject(row, true),
        hidden: (row) => !this.canApprove(row) },
      { icon: 'close-circle', tooltip: 'Reject', command: (row) => this.approveReject(row, false),
        hidden: (row) => !this.canApprove(row), danger: true },
      { icon: 'eye', tooltip: 'View Approval Status', command: (row) => this.viewApprovalStatus(row) },
      { icon: 'file-search', tooltip: 'View Request Details', command: (row) => this.viewRequestDetails(row) },
    ];
  }

  canApprove(row: any): boolean {
    if (row.status !== 'Progress') return false;
    const nodeName = row.nodeData?.node?.name;
    if (nodeName === 'ROLEAPPROVER') return false;
    if (this.currentUserId === row.job?.requesterId && !row.job?.workflow?.selfApprove) return false;
    return true;
  }

  loadData(event: TableQueryParams): void {
    this.lastQuery = event;
    this.loading = true;
    this.workflowService.getApprovals(event).subscribe({
      next: (resp) => {
        this.data = resp.data?.rows || resp.data?.content || [];
        this.totalRecords = resp.data?.records || resp.data?.totalElements || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  approveReject(row: any, approve: boolean): void {
    this.workflowService.checkNodeLevelComment(row.id).subscribe({
      next: (resp) => {
        const commentsRequired = resp.data === 'YES' || resp.data === true;
        if (commentsRequired) {
          this.openCommentModal(row, approve);
        } else {
          this.doApproveReject(row.id, approve);
        }
      },
      error: () => this.doApproveReject(row.id, approve),
    });
  }

  private openCommentModal(row: any, approve: boolean): void {
    const modal = this.modalService.create({
      nzTitle: approve ? 'Approve with Comment' : 'Reject with Comment',
      nzContent: AddCommentComponent,
      nzData: { jobId: row.job?.id, approvalId: row.id, approve, source: 'MyApprovals' },
      nzWidth: 520,
      nzFooter: null,
    });
    modal.afterClose.subscribe((result) => {
      if (result === 'saved') {
        this.notificationService.show({ success: true, message: approve ? 'Request approved' : 'Request rejected' } as any);
        if (this.lastQuery) this.loadData(this.lastQuery);
      }
    });
  }

  private doApproveReject(approvalId: number, approve: boolean): void {
    this.workflowService.approveReject(approvalId, approve).subscribe({
      next: (resp) => {
        this.notificationService.show(resp);
        if (this.lastQuery) this.loadData(this.lastQuery);
      },
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }

  viewApprovalStatus(row: any): void {
    this.modalService.create({
      nzTitle: 'Approval Status',
      nzContent: ApprovalDetailsComponent,
      nzData: { id: row.job?.id },
      nzWidth: 800,
      nzFooter: null,
    });
  }

  viewRequestDetails(row: any): void {
    this.router.navigate(['/cam/workflow/request-details', row.job?.id, row.status]);
  }
}
