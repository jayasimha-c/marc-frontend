import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-approval-details',
  templateUrl: './approval-details.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ApprovalDetailsComponent implements OnInit {
  approvals: any[] = [];
  loading = true;
  jobId: number;

  constructor(
    @Inject(NZ_MODAL_DATA) private modalData: any,
    private modalRef: NzModalRef,
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
  ) {
    this.jobId = this.modalData.id;
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.workflowService.getRequestApprovals(this.jobId).subscribe({
      next: (resp) => {
        this.approvals = resp.data?.approvalVOs || resp.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  sendEmail(approval: any): void {
    this.workflowService.sendEmail(approval.id).subscribe({
      next: (resp) => this.notificationService.show(resp),
      error: (err) => this.notificationService.handleHttpError(err),
    });
  }

  close(): void {
    this.modalRef.close();
  }
}
