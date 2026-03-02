import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WorkflowService } from '../services/workflow.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { FileSaverService } from '../../../../core/services/file-saver.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { AddCommentComponent } from '../add-comment/add-comment.component';
import { RolesListComponent } from '../roles-list/roles-list.component';

@Component({
  standalone: false,
  selector: 'app-request-details',
  templateUrl: './request-details.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class RequestDetailsComponent implements OnInit {
  jobId!: number;
  status = '';
  loading = true;

  // User info
  userRequest: any = {};
  owner: any = {};
  userInfo: any = {};

  // Tables data
  jobDetails: any[] = [];
  nodeData: any[] = [];
  comments: any[] = [];
  logs: any[] = [];
  assignedRoles: any[] = [];
  assignedGroups: any[] = [];

  activeTab = 0;
  selectedJobDetail: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workflowService: WorkflowService,
    private notificationService: NotificationService,
    private fileSaverService: FileSaverService,
    private attachmentService: AttachmentService,
    private modalService: NzModalService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.jobId = +params['id'];
      this.status = params['status'] || '';
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.workflowService.viewRequest(this.jobId).subscribe({
      next: (resp) => {
        const d = resp.data || {};
        this.jobDetails = d.list || [];
        this.nodeData = d.nodeData || [];
        this.userRequest = d.userRequest || {};
        this.owner = d.owner || {};
        this.userInfo = d.user || {};
        this.loading = false;

        this.loadComments();
        this.loadLogs();

        if (this.jobDetails.length > 0) {
          this.selectedJobDetail = this.jobDetails[0];
          this.loadAssignedData(this.selectedJobDetail);
        }
      },
      error: () => { this.loading = false; },
    });
  }

  loadComments(): void {
    this.workflowService.getComments(this.jobId).subscribe({
      next: (resp) => { this.comments = resp.data || []; },
    });
  }

  loadLogs(): void {
    this.workflowService.getRequestLogs(this.jobId).subscribe({
      next: (resp) => { this.logs = resp.data || []; },
    });
  }

  loadAssignedData(detail: any): void {
    this.selectedJobDetail = detail;
    this.workflowService.getAssignedRoles(this.jobId, detail.id).subscribe({
      next: (resp) => { this.assignedRoles = resp.data?.rows || resp.data || []; },
    });
    this.workflowService.getAssignedGroups(this.jobId, detail.id).subscribe({
      next: (resp) => { this.assignedGroups = resp.data?.rows || resp.data || []; },
    });
  }

  addComment(): void {
    const modal = this.modalService.create({
      nzTitle: 'Add Comment',
      nzContent: AddCommentComponent,
      nzData: { jobId: this.jobId, source: 'ViewDetails' },
      nzWidth: 520,
      nzFooter: null,
    });
    modal.afterClose.subscribe((result) => {
      if (result === 'saved') this.loadComments();
    });
  }

  downloadAttachment(comment: any): void {
    if (comment.dbAttachmentId) {
      this.attachmentService.download(comment.dbAttachmentId, comment.attachmentName);
    } else if (comment.attachmentId) {
      this.workflowService.downloadAttachment(comment.attachmentId).subscribe({
        next: (resp) => this.fileSaverService.saveAnyFile(resp, comment.attachmentName),
        error: (err) => this.notificationService.handleHttpError(err),
      });
    }
  }

  openRolesModal(detail: any): void {
    this.modalService.create({
      nzTitle: 'Assigned Roles',
      nzContent: RolesListComponent,
      nzData: { jobDetailId: detail.id, jobId: this.jobId },
      nzWidth: 900,
      nzFooter: null,
    });
  }

  goBack(): void {
    this.router.navigate(['/cam/workflow/my-requests']);
  }
}
