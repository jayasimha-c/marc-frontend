import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { QuillEditorComponent } from 'ngx-quill';
import { StepLibraryService, StepLibraryItem } from './step-library.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmDialogService } from '../../../../shared/components/confirm-dialog/confirm-dialog.service';
import { EVIDENCE_TYPES, EXPECTED_RESULTS } from './script-editor.component';
import { IcmControlService } from '../../icm-control.service';

@Component({
  selector: 'app-step-library-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    NzCardModule, NzButtonModule, NzIconModule, NzFormModule, NzInputModule,
    NzSelectModule, NzCheckboxModule, NzSpinModule, NzToolTipModule, NzGridModule, NzDividerModule, NzEmptyModule,
    QuillEditorComponent,
  ],
  templateUrl: './step-library-manager.component.html',
  styleUrls: ['./step-library-manager.component.scss'],
})
export class StepLibraryManagerComponent implements OnInit {
  loading = true;
  saving = false;
  allSteps: StepLibraryItem[] = [];
  filteredSteps: StepLibraryItem[] = [];
  selectedStep: StepLibraryItem | null = null;
  isCreating = false;
  searchTerm = '';
  stepForm: FormGroup;
  evidenceTypes = EVIDENCE_TYPES;
  expectedResults = EXPECTED_RESULTS;
  categories: any[] = [];

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
    private router: Router,
    private stepLibraryService: StepLibraryService,
    private notificationService: NotificationService,
    private confirmDialog: ConfirmDialogService,
    private icmControlService: IcmControlService,
  ) {
    this.stepForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadSteps();
  }

  loadCategories(): void {
    this.icmControlService.getCategoryList().subscribe({
      next: res => {
        if (res.success && res.data?.rows) {
          this.categories = res.data.rows;
        }
      },
      error: () => console.error('Failed to load categories'),
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      id: [null],
      stepName: ['', [Validators.required, Validators.maxLength(255)]],
      category: [''],
      tags: [''],
      stepDescription: [''],
      stepInstructions: [''],
      expectedOutcome: ['', Validators.maxLength(512)],
      expectedResult: ['PENDING'],
      evidenceType: ['ANY'],
      evidenceRequired: [false],
      allowedFileTypes: [''],
      maxFileSizeMb: [10],
      estimatedDurationMinutes: [null],
      referenceUrl: ['', Validators.maxLength(512)],
      isActive: [true],
    });
  }

  loadSteps(): void {
    this.loading = true;
    this.stepLibraryService.getAll().subscribe({
      next: res => {
        if (res.success && res.data?.rows) {
          this.allSteps = res.data.rows;
          this.filteredSteps = [...this.allSteps];
        }
        this.loading = false;
      },
      error: () => {
        this.notificationService.error('Failed to load step library');
        this.loading = false;
      },
    });
  }

  filterSteps(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSteps = [...this.allSteps];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredSteps = this.allSteps.filter(s =>
      s.stepName.toLowerCase().includes(term) ||
      (s.category && s.category.toLowerCase().includes(term)) ||
      (s.tags && s.tags.toLowerCase().includes(term))
    );
  }

  selectStep(step: StepLibraryItem): void {
    this.selectedStep = step;
    this.isCreating = false;
    this.stepForm.patchValue(step);
  }

  openEditor(): void {
    this.selectedStep = null;
    this.isCreating = true;
    this.stepForm.reset({
      expectedResult: 'PENDING',
      evidenceType: 'ANY',
      evidenceRequired: false,
      maxFileSizeMb: 10,
      isActive: true,
    });
  }

  cancelEdit(): void {
    this.selectedStep = null;
    this.isCreating = false;
    this.stepForm.reset();
  }

  saveStep(): void {
    if (this.stepForm.invalid) {
      this.stepForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const stepData = this.stepForm.value;
    this.stepLibraryService.save(stepData).subscribe({
      next: res => {
        if (res.success) {
          this.notificationService.success(
            this.isCreating ? 'Step created successfully' : 'Step updated successfully'
          );
          this.loadSteps();
          this.selectedStep = res.data;
          this.isCreating = false;
        } else {
          this.notificationService.error(res.message || 'Failed to save step');
        }
        this.saving = false;
      },
      error: err => {
        this.notificationService.error(err.error?.message || 'Error saving step');
        this.saving = false;
      },
    });
  }

  deleteStep(): void {
    if (!this.selectedStep?.id) return;
    this.confirmDialog.confirm({
      title: 'Delete Library Step',
      message: `Are you sure you want to delete "${this.selectedStep.stepName}"?`,
    }).subscribe(confirmed => {
      if (confirmed && this.selectedStep?.id) {
        this.stepLibraryService.delete(this.selectedStep.id).subscribe({
          next: () => {
            this.notificationService.success('Step deleted successfully');
            this.selectedStep = null;
            this.loadSteps();
          },
          error: () => this.notificationService.error('Failed to delete step'),
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/icm/master-data/scripts']);
  }
}
