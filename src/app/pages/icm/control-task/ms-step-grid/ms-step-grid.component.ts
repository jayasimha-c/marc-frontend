import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface StepData {
  id: number;
  stepOrder: number;
  stepName: string;
  stepDescription: string;
  stepInstructions: string;
  expectedOutcome: string;
  expectedResult: string;
  evidenceRequired: boolean;
  status: number | null;
  comment: string;
  attachmentId: number | null;
  attachmentName: string;
}

export interface StepChangeEvent {
  stepIndex: number;
  stepData: StepData;
}

@Component({
  standalone: false,
  selector: 'app-ms-step-grid',
  templateUrl: './ms-step-grid.component.html',
  styleUrls: ['./ms-step-grid.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('collapsed <=> expanded', animate('200ms ease-in-out')),
    ]),
  ],
})
export class MsStepGridComponent implements OnChanges {
  @Input() steps: StepData[] = [];
  @Input() readonly = false;
  @Input() showInstructions = true;
  @Input() showExpectedOutcome = true;

  @Output() stepChange = new EventEmitter<StepChangeEvent>();
  @Output() attachmentUpload = new EventEmitter<{ stepIndex: number; file: File }>();
  @Output() attachmentDownload = new EventEmitter<{ stepIndex: number; attachmentId: number }>();
  @Output() attachmentRemove = new EventEmitter<{ stepIndex: number }>();

  form!: FormGroup;
  expandedRows: Set<number> = new Set();

  statusOptions = [
    { value: null, label: 'Pending', icon: 'clock-circle', color: 'default' },
    { value: 1, label: 'Pass', icon: 'check-circle', color: 'success' },
    { value: 2, label: 'Failed', icon: 'close-circle', color: 'error' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      steps: this.fb.array([]),
    });
  }

  get stepsFormArray(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['steps'] && this.steps) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    const arr = this.fb.array(
      this.steps.map(step =>
        this.fb.group({
          id: [step.id],
          stepOrder: [step.stepOrder],
          stepName: [step.stepName],
          stepDescription: [step.stepDescription],
          stepInstructions: [step.stepInstructions],
          expectedOutcome: [step.expectedOutcome],
          expectedResult: [step.expectedResult],
          evidenceRequired: [step.evidenceRequired],
          status: [step.status],
          comment: [step.comment],
          attachmentId: [step.attachmentId],
          attachmentName: [step.attachmentName],
        })
      )
    );
    this.form.setControl('steps', arr);
  }

  toggleExpand(index: number): void {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  onStatusChange(index: number): void {
    this.emitStepChange(index);
  }

  onCommentChange(index: number): void {
    this.emitStepChange(index);
  }

  private emitStepChange(index: number): void {
    const group = this.stepsFormArray.at(index) as FormGroup;
    this.stepChange.emit({ stepIndex: index, stepData: group.getRawValue() });
  }

  onFileSelect(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.attachmentUpload.emit({ stepIndex: index, file: input.files[0] });
      input.value = '';
    }
  }

  onDownloadAttachment(index: number): void {
    const group = this.stepsFormArray.at(index) as FormGroup;
    const attachmentId = group.get('attachmentId')?.value;
    if (attachmentId) {
      this.attachmentDownload.emit({ stepIndex: index, attachmentId });
    }
  }

  onRemoveAttachment(index: number): void {
    const group = this.stepsFormArray.at(index) as FormGroup;
    group.patchValue({ attachmentId: null, attachmentName: '' });
    this.attachmentRemove.emit({ stepIndex: index });
  }

  updateAttachment(index: number, attachmentId: number, attachmentName: string): void {
    const group = this.stepsFormArray.at(index) as FormGroup;
    group.patchValue({ attachmentId, attachmentName });
  }

  getFormData(): StepData[] {
    return this.stepsFormArray.controls.map(c => (c as FormGroup).getRawValue());
  }

  getStatusTagColor(status: number | null): string {
    switch (status) {
      case 1: return 'success';
      case 2: return 'error';
      default: return 'default';
    }
  }

  getStatusLabel(status: number | null): string {
    switch (status) {
      case 1: return 'Pass';
      case 2: return 'Failed';
      default: return 'Pending';
    }
  }

  getExpectedResultColor(result: string): string {
    switch (result?.toUpperCase()) {
      case 'PASS': return 'success';
      case 'FAIL': return 'error';
      default: return 'default';
    }
  }

  getCountByStatus(status: number | null): number {
    return this.stepsFormArray.controls.filter(
      c => (c as FormGroup).get('status')?.value === status
    ).length;
  }
}
