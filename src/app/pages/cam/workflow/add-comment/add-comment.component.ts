import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { WorkflowService } from '../services/workflow.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  standalone: false,
  selector: 'app-add-comment',
  templateUrl: './add-comment.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class AddCommentComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  selectedFile: File | null = null;
  uploadedAttachmentId: number | null = null;

  jobId: number;
  approvalId: number;
  approve: boolean;
  source: string;

  constructor(
    @Inject(NZ_MODAL_DATA) private modalData: any,
    private modalRef: NzModalRef,
    private fb: FormBuilder,
    private workflowService: WorkflowService,
    private attachmentService: AttachmentService,
    private notificationService: NotificationService,
  ) {
    this.jobId = this.modalData.jobId;
    this.approvalId = this.modalData.approvalId;
    this.approve = this.modalData.approve;
    this.source = this.modalData.source || '';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      comment: ['', [Validators.required]],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.uploadedAttachmentId = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const comment = this.form.get('comment')?.value;

    if (this.selectedFile) {
      this.attachmentService.upload(this.selectedFile, 'WORKFLOW_COMMENT', this.jobId).subscribe({
        next: (resp) => {
          this.uploadedAttachmentId = resp.data?.id || null;
          this.doSave(comment);
        },
        error: () => this.doSave(comment),
      });
    } else {
      this.doSave(comment);
    }
  }

  private doSave(comment: string): void {
    if (this.source === 'MyApprovals') {
      const payload = {
        approvalId: this.approvalId,
        approval: this.approve,
        camComment: comment,
      };
      this.workflowService.approveRejectWithComment(payload).subscribe({
        next: () => { this.loading = false; this.modalRef.close('saved'); },
        error: (err) => { this.loading = false; this.notificationService.handleHttpError(err); },
      });
    } else {
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      const payload = {
        commentText: comment,
        owner: user?.id,
        created: new Date().getTime(),
        dbAttachmentId: this.uploadedAttachmentId,
        attachmentName: this.selectedFile?.name || null,
      };
      this.workflowService.saveComment({ jobId: this.jobId, ...payload }).subscribe({
        next: () => { this.loading = false; this.modalRef.close('saved'); },
        error: (err) => { this.loading = false; this.notificationService.handleHttpError(err); },
      });
    }
  }

  close(): void {
    this.modalRef.close();
  }
}
