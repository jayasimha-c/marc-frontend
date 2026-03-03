import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { QuillEditorComponent } from 'ngx-quill';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ManualScriptService } from './manual-script.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { StepLibraryPickerDialogComponent } from './step-library-picker-dialog.component';
import { StepLibraryItem } from './step-library.service';

export const EVIDENCE_TYPES = [
  { value: 'ANY', label: 'Any File Type' },
  { value: 'SCREENSHOT', label: 'Screenshot (Image)' },
  { value: 'DOCUMENT', label: 'Document (PDF, Word)' },
  { value: 'SPREADSHEET', label: 'Spreadsheet (Excel, CSV)' },
  { value: 'REPORT', label: 'Report Export' },
];

export const EXPECTED_RESULTS = [
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'PENDING', label: 'Pending' },
];

@Component({
  selector: 'app-script-editor',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule,
    NzButtonModule, NzIconModule, NzCheckboxModule, NzSpinModule, NzToolTipModule,
    NzSelectModule, NzGridModule, NzDividerModule, NzEmptyModule, NzSpaceModule, DragDropModule, QuillEditorComponent,
  ],
  templateUrl: './script-editor.component.html',
  styleUrls: ['./script-editor.component.scss'],
})
export class ScriptEditorComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  scriptForm: FormGroup;
  isEditMode = false;
  scriptId: number | null = null;
  loading = false;
  saving = false;
  fileName = '';
  fileId: number | null = null;
  evidenceTypes = EVIDENCE_TYPES;
  expectedResults = EXPECTED_RESULTS;
  expandedStepIndex: number | null = null;

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private scriptService: ManualScriptService,
    private notificationService: NotificationService,
    private nzModal: NzModalService,
  ) {
    this.scriptForm = this.fb.group({
      scriptName: ['', [Validators.required, Validators.maxLength(255)]],
      scriptDescription: ['', [Validators.maxLength(512)]],
      isActive: [true],
      steps: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.scriptId = +params['id'];
        this.isEditMode = true;
        this.loadScript();
      } else {
        this.isEditMode = false;
        this.addStep();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get stepsArray(): FormArray {
    return this.scriptForm.get('steps') as FormArray;
  }

  get stepsControls() {
    return this.stepsArray.controls;
  }

  loadScript(): void {
    if (!this.scriptId) return;
    this.loading = true;
    this.scriptService.getManualScripts().subscribe({
      next: res => {
        const rows = res.data?.rows || res.data || [];
        const script = rows.find((s: any) => s.id === this.scriptId);
        if (script) {
          this.populateForm(script);
        } else {
          this.notificationService.error('Script not found');
          this.router.navigate(['/icm/master-data/scripts']);
        }
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load script');
        this.loading = false;
      },
    });
  }

  populateForm(script: any): void {
    this.scriptForm.patchValue({
      scriptName: script.scriptName,
      scriptDescription: script.scriptDescription,
      isActive: script.isActive,
    });
    this.fileName = script.attachmentName || '';
    this.fileId = script.attachmentId || null;
    this.stepsArray.clear();
    if (script.steps?.length > 0) {
      [...script.steps].sort((a: any, b: any) => a.stepOrder - b.stepOrder)
        .forEach((step: any) => this.stepsArray.push(this.createStepFormGroup(step)));
    }
  }

  createStepFormGroup(step?: any): FormGroup {
    return this.fb.group({
      id: [step?.id || null],
      stepOrder: [step?.stepOrder || this.stepsArray.length + 1],
      stepName: [step?.stepName || '', [Validators.required, Validators.maxLength(255)]],
      isActive: [step?.isActive ?? true],
      stepDescription: [step?.stepDescription || ''],
      stepInstructions: [step?.stepInstructions || ''],
      expectedOutcome: [step?.expectedOutcome || '', [Validators.maxLength(512)]],
      expectedResult: [step?.expectedResult || 'PENDING'],
      evidenceType: [step?.evidenceType || 'ANY'],
      evidenceRequired: [step?.evidenceRequired ?? false],
      allowedFileTypes: [step?.allowedFileTypes || ''],
      maxFileSizeMb: [step?.maxFileSizeMb || 10],
      estimatedDurationMinutes: [step?.estimatedDurationMinutes || null],
      referenceUrl: [step?.referenceUrl || '', [Validators.maxLength(512)]],
    });
  }

  toggleStepExpansion(index: number): void {
    this.expandedStepIndex = this.expandedStepIndex === index ? null : index;
  }

  isStepExpanded(index: number): boolean {
    return this.expandedStepIndex === index;
  }

  addStep(): void {
    this.stepsArray.push(this.createStepFormGroup());
  }

  removeStep(index: number): void {
    if (this.stepsArray.length > 0) {
      this.stepsArray.removeAt(index);
      this.reorderSteps();
    }
  }

  reorderSteps(): void {
    this.stepsArray.controls.forEach((ctrl, i) => ctrl.get('stepOrder')?.setValue(i + 1));
  }

  onDropStep(event: CdkDragDrop<FormGroup[]>): void {
    moveItemInArray(this.stepsArray.controls, event.previousIndex, event.currentIndex);
    this.reorderSteps();
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      moveItemInArray(this.stepsArray.controls, index, index - 1);
      this.reorderSteps();
    }
  }

  moveStepDown(index: number): void {
    if (index < this.stepsArray.length - 1) {
      moveItemInArray(this.stepsArray.controls, index, index + 1);
      this.reorderSteps();
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;
    this.scriptService.uploadAttachment(file, 'ICM_CONTROL', 0).subscribe({
      next: res => {
        if (res.success) {
          this.fileId = res.data.id;
          this.fileName = res.data.originalName;
          this.notificationService.success('File uploaded');
        } else {
          this.notificationService.error(res.message || 'Upload failed');
        }
      },
      error: err => this.notificationService.handleHttpError(err),
    });
    event.target.value = '';
  }

  removeAttachment(): void {
    this.fileName = '';
    this.fileId = null;
  }

  save(): void {
    if (this.scriptForm.invalid) {
      this.scriptForm.markAllAsTouched();
      this.notificationService.error('Please fill in all required fields');
      return;
    }
    if (this.stepsArray.length === 0) {
      this.notificationService.error('Please add at least one step');
      return;
    }

    this.saving = true;
    const v = this.scriptForm.value;
    const payload: any = {
      scriptName: v.scriptName,
      scriptDescription: v.scriptDescription,
      isActive: v.isActive,
      attachmentId: this.fileId,
      attachmentName: this.fileName,
      steps: v.steps.map((step: any, i: number) => ({
        id: step.id,
        stepOrder: i + 1,
        stepName: step.stepName,
        isActive: step.isActive,
        stepDescription: step.stepDescription || null,
        stepInstructions: step.stepInstructions || null,
        expectedOutcome: step.expectedOutcome || null,
        expectedResult: step.expectedResult || 'PENDING',
        evidenceType: step.evidenceType || 'ANY',
        evidenceRequired: step.evidenceRequired || false,
        allowedFileTypes: step.allowedFileTypes || null,
        maxFileSizeMb: step.maxFileSizeMb || 10,
        estimatedDurationMinutes: step.estimatedDurationMinutes || null,
        referenceUrl: step.referenceUrl || null,
      })),
    };
    if (this.isEditMode && this.scriptId) payload.id = this.scriptId;

    this.scriptService.saveManualScripts(payload).subscribe({
      next: resp => {
        this.notificationService.show(resp);
        this.saving = false;
        this.router.navigate(['/icm/master-data/scripts']);
      },
      error: err => {
        this.notificationService.handleHttpError(err);
        this.saving = false;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/icm/master-data/scripts']);
  }

  openStepLibrary(): void {
    this.nzModal.create({
      nzContent: StepLibraryPickerDialogComponent,
      nzWidth: '700px',
      nzClassName: 'updated-modal',
      nzFooter: null,
      nzData: {},
    }).afterClose.subscribe(result => {
      if (result?.steps?.length > 0) {
        result.steps.forEach((libStep: StepLibraryItem) => {
          this.stepsArray.push(this.createStepFormGroup({
            stepOrder: this.stepsArray.length + 1,
            stepName: libStep.stepName,
            isActive: true,
            stepDescription: libStep.stepDescription,
            stepInstructions: libStep.stepInstructions,
            expectedOutcome: libStep.expectedOutcome,
            expectedResult: libStep.expectedResult || 'PENDING',
            evidenceType: libStep.evidenceType || 'ANY',
            evidenceRequired: libStep.evidenceRequired || false,
            allowedFileTypes: libStep.allowedFileTypes,
            maxFileSizeMb: libStep.maxFileSizeMb || 10,
            estimatedDurationMinutes: libStep.estimatedDurationMinutes,
            referenceUrl: libStep.referenceUrl,
          }));
        });
        this.notificationService.success(`Added ${result.steps.length} step(s) from library`);
      }
    });
  }
}
