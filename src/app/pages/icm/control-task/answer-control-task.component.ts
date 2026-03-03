import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IcmControlService } from '../icm-control.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MsStepGridComponent, StepData, StepChangeEvent } from './ms-step-grid/ms-step-grid.component';

@Component({
  standalone: false,
  selector: 'app-answer-control-task',
  templateUrl: './answer-control-task.component.html',
})
export class AnswerControlTaskComponent implements OnInit {
  @ViewChild('stepGrid') stepGrid!: MsStepGridComponent;

  id: any;
  wizardManualScript: any;
  stepData: StepData[] = [];
  loading = true;
  saving = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private icmService: IcmControlService,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.loadTaskData();
  }

  loadTaskData(): void {
    this.loading = true;
    this.icmService.getManualTaskWizard(this.id).subscribe({
      next: (res) => {
        this.wizardManualScript = res.data;
        this.mapTaskDataToSteps(res.data);
        this.loading = false;
      },
      error: () => {
        this.notification.error( 'Failed to load task data');
        this.loading = false;
      },
    });
  }

  private mapTaskDataToSteps(taskData: any): void {
    if (!taskData?.taskSteps) {
      this.stepData = [];
      return;
    }
    this.stepData = taskData.taskSteps.map((step: any) => ({
      id: step.id,
      stepOrder: step.stepOrder || step.scriptStep?.stepOrder,
      stepName: step.scriptStep?.stepName || `Step ${step.stepOrder}`,
      stepDescription: step.scriptStep?.stepDescription || '',
      stepInstructions: step.scriptStep?.stepInstructions || '',
      expectedOutcome: step.scriptStep?.expectedOutcome || '',
      expectedResult: step.scriptStep?.expectedResult || 'PENDING',
      evidenceRequired: step.scriptStep?.evidenceRequired || false,
      status: step.status,
      comment: step.comment?.commentText || '',
      attachmentId: step.comment?.attachmentId || null,
      attachmentName: step.comment?.attachmentName || '',
    }));
  }

  onStepChange(event: StepChangeEvent): void {
    if (this.stepData[event.stepIndex]) {
      this.stepData[event.stepIndex] = { ...event.stepData };
    }
  }

  onAttachmentUpload(event: { stepIndex: number; file: File }): void {
    this.icmService.uploadAttachment(event.file, 'ICM_COMMENT', 0).subscribe({
      next: (res) => {
        if (res.success) {
          this.stepGrid.updateAttachment(event.stepIndex, res.data.id, res.data.originalName);
          if (this.stepData[event.stepIndex]) {
            this.stepData[event.stepIndex].attachmentId = res.data.id;
            this.stepData[event.stepIndex].attachmentName = res.data.originalName;
          }
          this.notification.success( 'File uploaded successfully');
        }
      },
      error: (err) => {
        this.notification.error( err.error?.message || 'Error uploading file');
      },
    });
  }

  onAttachmentDownload(event: { stepIndex: number; attachmentId: number }): void {
    this.icmService.downloadAttachment(event.attachmentId).subscribe({
      next: (blob: Blob) => {
        const step = this.stepData[event.stepIndex];
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = step?.attachmentName || 'attachment';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.notification.error( 'Error downloading attachment');
      },
    });
  }

  onAttachmentRemove(event: { stepIndex: number }): void {
    if (this.stepData[event.stepIndex]) {
      this.stepData[event.stepIndex].attachmentId = null;
      this.stepData[event.stepIndex].attachmentName = '';
    }
  }

  private buildPayload(): any {
    const steps = this.stepGrid ? this.stepGrid.getFormData() : this.stepData;
    return {
      id: this.id,
      taskSteps: steps.map(step => ({
        id: step.id,
        scriptStep: { id: step.id },
        stepOrder: step.stepOrder,
        status: step.status,
        executeDate: null,
        comment: {
          commentText: step.comment || null,
          attachmentId: step.attachmentId || null,
          attachmentName: step.attachmentName || null,
        },
      })),
    };
  }

  save(): void {
    this.saving = true;
    this.icmService.saveManualTaskAnswer(this.buildPayload()).subscribe({
      next: () => {
        this.saving = false;
        this.notification.success( 'Task completed successfully');
        this.goBack();
      },
      error: (err) => {
        this.saving = false;
        this.notification.error( err.error?.message || 'Error saving task');
      },
    });
  }

  draftSave(): void {
    this.saving = true;
    this.icmService.saveManualTaskAnswerDraft(this.buildPayload()).subscribe({
      next: () => {
        this.saving = false;
        this.notification.success( 'Draft saved successfully');
      },
      error: (err) => {
        this.saving = false;
        this.notification.error( err.error?.message || 'Error saving draft');
      },
    });
  }

  goBack(): void {
    const controlId = this.wizardManualScript?.icmControl?.id;
    if (controlId) {
      this.router.navigate([`/icm/view-control-task/${controlId}`]);
    } else {
      this.router.navigate(['/icm/control-tasks']);
    }
  }
}
