import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { AbapService } from '../../abap.service';

type ImportMode = 'merge' | 'update' | 'overwrite';

interface ImportModeOption {
  id: ImportMode;
  name: string;
  description: string;
  icon: string;
  warning?: string;
}

interface PreviewResult {
  fileName: string;
  totalRules: number;
  newRules: number;
  existingRules: number;
  previewRules: any[];
  globalErrors: string[];
  globalWarnings: string[];
}

interface SimulationResult {
  fileName: string;
  importMode: string;
  totalRules: number;
  rulesToCreate: number;
  rulesToUpdate: number;
  rulesToSkip: number;
  rulesWithErrors: number;
  canProceed: boolean;
  simulationDetails: any[];
  globalErrors: string[];
  globalWarnings: string[];
}

interface ImportResult {
  fileName: string;
  importMode: string;
  importedBy: string;
  totalRules: number;
  rulesCreated: number;
  rulesUpdated: number;
  rulesSkipped: number;
  rulesFailed: number;
  rulesDeleted: number;
  success: boolean;
  partialSuccess: boolean;
  duration: number;
  errors: any[];
}

@Component({
  standalone: false,
  selector: 'app-rule-import-wizard',
  templateUrl: './rule-import-wizard.component.html',
  styleUrls: ['./rule-import-wizard.component.scss'],
})
export class RuleImportWizardComponent implements OnInit, OnDestroy {
  currentStep = 0;
  private destroy$ = new Subject<void>();

  uploadForm!: FormGroup;
  modeForm!: FormGroup;

  // File upload
  selectedFile: File | null = null;
  dragOver = false;
  validating = false;
  previewResult: PreviewResult | null = null;

  // Import modes
  importModes: ImportModeOption[] = [
    {
      id: 'merge',
      name: 'Merge',
      description: 'Add new rules only. Skip rules that already exist in the database.',
      icon: 'merge-cells',
    },
    {
      id: 'update',
      name: 'Update',
      description: 'Add new rules and update existing ones with imported data.',
      icon: 'sync',
    },
    {
      id: 'overwrite',
      name: 'Overwrite',
      description: 'Delete ALL existing rules and import fresh from file.',
      icon: 'reload',
      warning: 'This will delete ALL existing rules before importing. This action cannot be undone.',
    },
  ];
  selectedImportMode: ImportMode = 'merge';

  // Simulation
  simulating = false;
  simulationResult: SimulationResult | null = null;

  // Import
  importing = false;
  importComplete = false;
  importResult: ImportResult | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private abapService: AbapService,
    private notification: NotificationService
  ) {
    this.uploadForm = this.fb.group({
      fileSelected: [false, Validators.requiredTrue],
    });
    this.modeForm = this.fb.group({
      importMode: ['merge', Validators.required],
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Navigation
  navigateBack(): void {
    this.router.navigate(['/sap-abap-scanner/rules-management']);
  }

  onNext(): void {
    switch (this.currentStep) {
      case 0:
        if (!this.previewResult) {
          this.notification.error('Please upload and validate a file first');
          return;
        }
        if (this.previewResult.globalErrors?.length > 0) {
          this.notification.error('File has validation errors. Please fix and re-upload.');
          return;
        }
        break;
      case 1:
        if (!this.selectedImportMode) {
          this.notification.error('Please select an import mode');
          return;
        }
        this.runSimulation();
        break;
      case 2:
        if (!this.simulationResult?.canProceed) {
          this.notification.error('Cannot proceed with import due to validation errors');
          return;
        }
        break;
    }
    this.currentStep++;
  }

  canProceedToNext(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!this.previewResult && (!this.previewResult.globalErrors || this.previewResult.globalErrors.length === 0);
      case 1:
        return !!this.selectedImportMode;
      case 2:
        return !!this.simulationResult?.canProceed;
      default:
        return true;
    }
  }

  get showNextButton(): boolean {
    return this.currentStep < 3;
  }

  get showImportButton(): boolean {
    return this.currentStep === 3;
  }

  // File Upload
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  private handleFileSelection(file: File): void {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      this.notification.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    this.selectedFile = file;
    this.previewResult = null;
    this.simulationResult = null;
    this.validateFile();
  }

  private validateFile(): void {
    if (!this.selectedFile) return;
    this.validating = true;
    this.abapService
      .previewRuleImport(this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.validating = false;
          if (resp.success && resp.data) {
            this.previewResult = resp.data as PreviewResult;
            this.uploadForm.patchValue({ fileSelected: true });
          } else {
            this.notification.error(resp.message || 'File validation failed');
            this.uploadForm.patchValue({ fileSelected: false });
          }
        },
        error: (err) => {
          this.validating = false;
          this.notification.error('Failed to validate file: ' + (err.error?.message || err.message));
          this.uploadForm.patchValue({ fileSelected: false });
        },
      });
  }

  removeFile(): void {
    this.selectedFile = null;
    this.previewResult = null;
    this.simulationResult = null;
    this.uploadForm.patchValue({ fileSelected: false });
  }

  downloadTemplate(): void {
    this.abapService
      .downloadImportTemplate()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'abap_rules_import_template.xlsx';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.notification.error('Failed to download template');
        },
      });
  }

  // Import Mode
  onImportModeSelected(mode: ImportMode): void {
    this.selectedImportMode = mode;
    this.modeForm.patchValue({ importMode: mode });
    this.simulationResult = null;
  }

  get selectedImportModeObj(): ImportModeOption | undefined {
    return this.importModes.find((m) => m.id === this.selectedImportMode);
  }

  // Simulation
  private runSimulation(): void {
    if (!this.selectedFile) return;
    this.simulating = true;
    this.simulationResult = null;
    this.abapService
      .simulateRuleImport(this.selectedFile, this.selectedImportMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.simulating = false;
          if (resp.success && resp.data) {
            this.simulationResult = resp.data as SimulationResult;
          } else {
            this.notification.error(resp.message || 'Simulation failed');
          }
        },
        error: (err) => {
          this.simulating = false;
          this.notification.error('Failed to simulate import: ' + (err.error?.message || err.message));
        },
      });
  }

  // Import Execution
  onImport(): void {
    if (!this.selectedFile || !this.simulationResult?.canProceed) return;
    this.importing = true;
    this.abapService
      .executeRuleImport(this.selectedFile, this.selectedImportMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.importing = false;
          if (resp.success && resp.data) {
            this.importResult = resp.data as ImportResult;
            this.importComplete = true;
            if (this.importResult.success && !this.importResult.partialSuccess) {
              this.notification.success(
                `Import completed: ${this.importResult.rulesCreated} created, ` +
                  `${this.importResult.rulesUpdated} updated, ` +
                  `${this.importResult.rulesSkipped} skipped`
              );
            } else if (this.importResult.partialSuccess) {
              this.notification.warn(`Import completed with errors: ${this.importResult.rulesFailed} failed`);
            } else {
              this.notification.error(resp.message || 'Import failed');
            }
          } else {
            this.notification.error(resp.message || 'Import failed');
          }
        },
        error: (err) => {
          this.importing = false;
          this.notification.error('Import failed: ' + (err.error?.message || err.message));
        },
      });
  }

  // Helpers
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  startNewImport(): void {
    this.currentStep = 0;
    this.selectedFile = null;
    this.previewResult = null;
    this.simulationResult = null;
    this.selectedImportMode = 'merge';
    this.importComplete = false;
    this.importResult = null;
    this.uploadForm.reset();
    this.uploadForm.patchValue({ fileSelected: false });
    this.modeForm.reset();
    this.modeForm.patchValue({ importMode: 'merge' });
  }
}
